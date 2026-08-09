import { revalidatePath } from "next/cache";
import { appendBlockNote, closeBlockById } from "@/lib/active-blocks";
import { replyAsTelegramMentor } from "@/lib/telegram-mentor";
import {
  answerCallbackQuery,
  editMessageReplyMarkup,
  formatBlockClosedMessage,
  formatNotePromptMessage,
  isAllowedChat,
  parseBlockIdFromNotePrompt,
  parseCallbackData,
  sendTelegramMessage,
  telegramConfigured,
  verifyTelegramSecret,
} from "@/lib/telegram";
import { formatSystemNotice, markdownToTelegramHtml } from "@/lib/telegram-format";

export const runtime = "nodejs";

type TelegramChat = { id: number; type: string };
type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  rich_message?: { blocks?: unknown[] };
  reply_to_message?: TelegramMessage;
};
type TelegramCallbackQuery = {
  id: string;
  data?: string;
  message?: TelegramMessage;
};
type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

function unauthorized() {
  return Response.json({ ok: false }, { status: 401 });
}

function ok() {
  return Response.json({ ok: true });
}

/** Plain text zo správy (klasický text alebo hrubý dump rich blocks). */
function messagePlainText(message: TelegramMessage | undefined): string {
  if (!message) return "";
  if (message.text) return message.text;
  if (!message.rich_message?.blocks) return "";
  return extractPlainFromUnknown(message.rich_message.blocks);
}

function extractPlainFromUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(extractPlainFromUnknown).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const parts: string[] = [];
    if ("text" in obj) parts.push(extractPlainFromUnknown(obj.text));
    if ("blocks" in obj) parts.push(extractPlainFromUnknown(obj.blocks));
    if ("items" in obj) parts.push(extractPlainFromUnknown(obj.items));
    if ("content" in obj) parts.push(extractPlainFromUnknown(obj.content));
    return parts.filter(Boolean).join("\n");
  }
  return "";
}

export async function POST(req: Request) {
  if (!telegramConfigured()) {
    return Response.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN alebo TELEGRAM_CHAT_ID chýba" },
      { status: 500 },
    );
  }

  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
  const querySecret = new URL(req.url).searchParams.get("secret");
  if (!verifyTelegramSecret(headerSecret, querySecret)) {
    return unauthorized();
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return ok();
  }

  if (update.message && (update.message.text || update.message.rich_message)) {
    await handleMessage(update.message);
    return ok();
  }

  return ok();
}

async function handleCallback(query: TelegramCallbackQuery) {
  const chatId = query.message?.chat.id;
  if (chatId == null || !isAllowedChat(chatId)) {
    await answerCallbackQuery(query.id, "Nepovolený chat.");
    return;
  }

  const parsed = query.data ? parseCallbackData(query.data) : null;
  if (!parsed) {
    await answerCallbackQuery(query.id, "Neznáma akcia.");
    return;
  }

  if (parsed.action === "close") {
    const closed = await closeBlockById(parsed.blockId);
    await answerCallbackQuery(
      query.id,
      closed ? "Blok odfajknutý." : "Blok sa nenašiel alebo už je uzavretý.",
    );
    if (closed && query.message) {
      await editMessageReplyMarkup(chatId, query.message.message_id);
      await sendTelegramMessage(formatBlockClosedMessage(closed.title), {
        chatId,
      });
      revalidatePath("/");
    }
    return;
  }

  await answerCallbackQuery(query.id, "Napíš poznámku ako odpoveď.");
  // Klasický HTML: reply_to_message.text spoľahlivo obsahuje BLK:id marker
  await sendTelegramMessage(
    markdownToTelegramHtml(formatNotePromptMessage(parsed.blockId)),
    {
      chatId,
      forceReply: true,
      format: "html",
    },
  );
}

async function handleMessage(message: TelegramMessage) {
  if (!isAllowedChat(message.chat.id)) return;

  const text = message.text?.trim();
  if (!text) return;

  const chatId = message.chat.id;

  // 1) Odpoveď na BLK:id → poznámka k aktívnemu bloku (nie chat)
  const repliedText = messagePlainText(message.reply_to_message);
  if (repliedText) {
    const blockId = parseBlockIdFromNotePrompt(repliedText);
    if (blockId != null) {
      const updated = await appendBlockNote(blockId, text);
      if (!updated) {
        await sendTelegramMessage(
          formatSystemNotice(
            "Blok nenájdený",
            "Blok sa nenašiel alebo už je uzavretý.",
            "⚠️",
          ),
          { chatId },
        );
        return;
      }
      await sendTelegramMessage(
        formatSystemNotice(
          "Poznámka uložená",
          `K bloku „${updated.title}“.`,
          "📝",
        ),
        { chatId },
      );
      revalidatePath("/");
      return;
    }
  }

  // 2) Bežná správa → chat s AI mentorom
  if (text === "/start") {
    await sendTelegramMessage(
      [
        "# 🧭 LifeOS mentor",
        "",
        "Napíš, čo ťa tlačí, alebo počkaj na **ranný fokus**.",
        "",
        "Odpovede sú formátované s nadpismi a tučným textom priamo v Telegrame.",
      ].join("\n"),
      { chatId },
    );
    return;
  }

  const answer = await replyAsTelegramMentor(text);
  await sendTelegramMessage(answer, { chatId });
}
