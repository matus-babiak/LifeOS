import { revalidatePath } from "next/cache";
import { appendBlockNote, closeBlockById } from "@/lib/active-blocks";
import { saveAiNoteFromTelegram } from "@/lib/ai-notes";
import {
  formatCapturePromptMessage,
  formatGoalAreaMessage,
  formatNewMenuMessage,
  formatNoteCategoryMessage,
  formatSaveMenuMessage,
  goalAreaKeyboard,
  isNewCommand,
  isUlozitCommand,
  newCaptureKeyboard,
  noteCategoryKeyboard,
  parseCaptureFromPrompt,
  parseNewCallbackData,
  parseSaveCallbackData,
  pathsForCapture,
  saveCaptureFromPrompt,
  saveCaptureKeyboard,
  saveMessageKeyboard,
  type CapturePrompt,
  type SaveCallback,
} from "@/lib/telegram-capture";
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

async function commitCapture(prompt: CapturePrompt, text: string, chatId: number) {
  const saved = await saveCaptureFromPrompt(prompt, text);
  if (!saved.ok) {
    await sendTelegramMessage(
      formatSystemNotice(
        "Neuložené",
        "Text je prázdny alebo kategória/oblasť neplatí.",
        "⚠️",
      ),
      { chatId },
    );
    return;
  }
  for (const path of pathsForCapture(saved.type)) {
    revalidatePath(path);
  }
  await sendTelegramMessage(saved.notice, { chatId });
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

  const data = query.data ?? "";

  const saveCb = parseSaveCallbackData(data);
  if (saveCb) {
    await handleSaveCallback(query, chatId, saveCb);
    return;
  }

  const newCb = parseNewCallbackData(data);
  if (newCb) {
    await handleNewCallback(query, chatId, newCb);
    return;
  }

  const parsed = parseCallbackData(data);
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

/** Text zo správy, ktorú chceme uložiť (odpoveď na ňu v menu). */
function saveSourceText(query: TelegramCallbackQuery): string {
  return messagePlainText(query.message?.reply_to_message).trim();
}

function saveSourceMessageId(query: TelegramCallbackQuery): number | null {
  const id = query.message?.reply_to_message?.message_id;
  return id != null ? id : null;
}

async function handleSaveCallback(
  query: TelegramCallbackQuery,
  chatId: number,
  saveCb: SaveCallback,
) {
  // One-click: tlačidlo pod AI odpoveďou → AI poznámky + auto kategória
  if (saveCb.action === "ask") {
    const sourceText = messagePlainText(query.message).trim();
    if (!sourceText) {
      await answerCallbackQuery(query.id, "Správu sa nepodarilo nájsť.");
      return;
    }
    await answerCallbackQuery(query.id, "Ukladám…");
    const saved = await saveAiNoteFromTelegram(sourceText);
    if (!saved.ok) {
      await sendTelegramMessage(
        formatSystemNotice("Neuložené", "Text správy je prázdny.", "⚠️"),
        { chatId },
      );
      return;
    }
    revalidatePath("/ai-poznamky");
    await sendTelegramMessage(saved.notice, { chatId });
    return;
  }

  const sourceId = saveSourceMessageId(query);
  const sourceText = saveSourceText(query);
  if (!sourceId || !sourceText) {
    await answerCallbackQuery(
      query.id,
      "Chýba pôvodná správa. Podrž ju, Odpovedať, /ulozit.",
    );
    return;
  }

  if (saveCb.action === "type") {
    if (saveCb.type === "note") {
      await answerCallbackQuery(query.id, "Vyber kategóriu.");
      await sendTelegramMessage(formatNoteCategoryMessage(), {
        chatId,
        replyToMessageId: sourceId,
        replyMarkup: await noteCategoryKeyboard("save"),
      });
      return;
    }
    if (saveCb.type === "goal") {
      await answerCallbackQuery(query.id, "Vyber oblasť.");
      await sendTelegramMessage(formatGoalAreaMessage(), {
        chatId,
        replyToMessageId: sourceId,
        replyMarkup: await goalAreaKeyboard("save"),
      });
      return;
    }

    await answerCallbackQuery(query.id, "Ukladám…");
    await commitCapture({ type: saveCb.type }, sourceText, chatId);
    return;
  }

  if (saveCb.action === "note-category") {
    await answerCallbackQuery(query.id, "Ukladám…");
    await commitCapture(
      { type: "note", category: saveCb.category },
      sourceText,
      chatId,
    );
    return;
  }

  await answerCallbackQuery(query.id, "Ukladám…");
  await commitCapture(
    { type: "goal", areaId: saveCb.areaId },
    sourceText,
    chatId,
  );
}

async function handleNewCallback(
  query: TelegramCallbackQuery,
  chatId: number,
  newCb: NonNullable<ReturnType<typeof parseNewCallbackData>>,
) {
  if (newCb.action === "type") {
    if (newCb.type === "note") {
      await answerCallbackQuery(query.id, "Vyber kategóriu.");
      await sendTelegramMessage(formatNoteCategoryMessage(), {
        chatId,
        replyMarkup: await noteCategoryKeyboard("new"),
      });
      return;
    }
    if (newCb.type === "goal") {
      await answerCallbackQuery(query.id, "Vyber oblasť.");
      await sendTelegramMessage(formatGoalAreaMessage(), {
        chatId,
        replyMarkup: await goalAreaKeyboard("new"),
      });
      return;
    }

    await answerCallbackQuery(query.id, "Napíš text ako odpoveď.");
    await sendTelegramMessage(
      markdownToTelegramHtml(
        formatCapturePromptMessage({ type: newCb.type }),
      ),
      {
        chatId,
        forceReply: true,
        format: "html",
      },
    );
    return;
  }

  if (newCb.action === "note-category") {
    await answerCallbackQuery(query.id, "Napíš poznámku ako odpoveď.");
    await sendTelegramMessage(
      markdownToTelegramHtml(
        formatCapturePromptMessage({
          type: "note",
          category: newCb.category,
        }),
      ),
      {
        chatId,
        forceReply: true,
        format: "html",
      },
    );
    return;
  }

  await answerCallbackQuery(query.id, "Napíš cieľ ako odpoveď.");
  await sendTelegramMessage(
    markdownToTelegramHtml(
      formatCapturePromptMessage({ type: "goal", areaId: newCb.areaId }),
    ),
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
  const repliedText = messagePlainText(message.reply_to_message);

  // 1) Príkazy majú prednosť aj pri reply
  // (inak by /ulozit na správu s BLK: išlo ako dopísanie k bloku).
  if (text === "/start") {
    await sendTelegramMessage(
      [
        "# LifeOS mentor",
        "",
        "Napíš, čo ťa tlačí, alebo počkaj na **ranný fokus**.",
        "",
        "Nový zápis: **/new**",
        "Uložiť správu (myšlienka / poznámka / …): podrž ju → Odpovedať → **/ulozit**",
        "Tlačidlo **Uložiť do LifeOS** pod AI odpoveďou: uloží do AI poznámok.",
      ].join("\n"),
      { chatId },
    );
    return;
  }

  if (isNewCommand(text)) {
    await sendTelegramMessage(formatNewMenuMessage(), {
      chatId,
      replyMarkup: newCaptureKeyboard(),
    });
    return;
  }

  if (isUlozitCommand(text)) {
    const sourceId = message.reply_to_message?.message_id;
    const sourceText = repliedText.trim();
    if (!sourceId || !sourceText) {
      await sendTelegramMessage(
        formatSystemNotice(
          "Ako uložiť správu",
          "Podrž správu → Odpovedať → napíš /ulozit. Tlačidlo Uložiť do LifeOS pod AI odpoveďou uloží priamo do AI poznámok.",
          "💡",
        ),
        { chatId },
      );
      return;
    }
    await sendTelegramMessage(formatSaveMenuMessage(), {
      chatId,
      replyToMessageId: sourceId,
      replyMarkup: saveCaptureKeyboard(),
    });
    return;
  }

  // 2) Odpoveď na BLK:id → poznámka k aktívnemu bloku (nie chat)
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

    // 3) Odpoveď na CAP:… → nový zápis (/new)
    const capture = parseCaptureFromPrompt(repliedText);
    if (capture) {
      await commitCapture(capture, text, chatId);
      return;
    }
  }

  // 4) Bežná správa → chat s AI mentorom
  const answer = await replyAsTelegramMentor(text);
  await sendTelegramMessage(answer, {
    chatId,
    replyMarkup: saveMessageKeyboard(),
  });
}
