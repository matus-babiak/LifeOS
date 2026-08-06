import { revalidatePath } from "next/cache";
import { appendBlockNote, closeBlockById } from "@/lib/active-blocks";
import {
  answerCallbackQuery,
  editMessageReplyMarkup,
  isAllowedChat,
  notePromptMarker,
  parseBlockIdFromNotePrompt,
  parseCallbackData,
  sendTelegramMessage,
  telegramConfigured,
  verifyTelegramSecret,
} from "@/lib/telegram";

export const runtime = "nodejs";

type TelegramChat = { id: number; type: string };
type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  text?: string;
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

  if (update.message?.text) {
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
    // Rovnaká DB logika ako closeActiveBlock (bez cookie session)
    const closed = await closeBlockById(parsed.blockId);
    await answerCallbackQuery(
      query.id,
      closed ? "Blok odfajknutý." : "Blok sa nenašiel alebo už je uzavretý.",
    );
    if (closed && query.message) {
      await editMessageReplyMarkup(chatId, query.message.message_id);
      await sendTelegramMessage(`Hotovo: „${closed.title}“ je vyriešený.`, {
        chatId,
      });
      revalidatePath("/");
    }
    return;
  }

  await answerCallbackQuery(query.id, "Napíš poznámku ako odpoveď.");
  await sendTelegramMessage(
    `Napíš poznámku k bloku (odpovedz na túto správu).\n${notePromptMarker(parsed.blockId)}`,
    { chatId, forceReply: true },
  );
}

async function handleMessage(message: TelegramMessage) {
  if (!isAllowedChat(message.chat.id)) return;

  const text = message.text?.trim();
  if (!text) return;

  // Poznámka: odpoveď na pripomenutie (BLK:id) alebo na výzvu po „Dopísať“
  const replied = message.reply_to_message?.text;
  if (!replied) return;

  const blockId = parseBlockIdFromNotePrompt(replied);
  if (blockId == null) return;

  const updated = await appendBlockNote(blockId, text);
  if (!updated) {
    await sendTelegramMessage("Blok sa nenašiel alebo už je uzavretý.", {
      chatId: message.chat.id,
    });
    return;
  }

  await sendTelegramMessage(`Poznámka uložená k „${updated.title}“.`, {
    chatId: message.chat.id,
  });
  revalidatePath("/");
}
