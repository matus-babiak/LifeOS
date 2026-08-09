/**
 * Tenký klient Telegram Bot API.
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET (voliteľné).
 *
 * Formátovanie: predvolene Rich Markdown (sendRichMessage) s H1/H2, **tučným**,
 * zoznamami. Pri zlyhaní fallback na klasický HTML parse_mode.
 */

import {
  formatSystemNotice,
  markdownToTelegramHtml,
  stripOuterCodeFence,
} from "@/lib/telegram-format";

const API = "https://api.telegram.org";

export type InlineButton = {
  text: string;
  callback_data: string;
};

export type TelegramTextFormat = "rich" | "html" | "plain";

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function telegramChatId(): string | null {
  return process.env.TELEGRAM_CHAT_ID?.trim() || null;
}

export function telegramConfigured(): boolean {
  return Boolean(token() && telegramChatId());
}

/** Overí secret z webhooku (header X-Telegram-Bot-Api-Secret-Token alebo ?secret=). */
export function verifyTelegramSecret(
  headerSecret: string | null,
  querySecret: string | null,
): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  // V produkcii so zapnutým botom vyžadujeme secret; bez tokenu (lokál) nechaj prejsť.
  if (!expected) {
    return !token();
  }
  return headerSecret === expected || querySecret === expected;
}

export function isAllowedChat(chatId: number | string): boolean {
  const allowed = telegramChatId();
  if (!allowed) return false;
  return String(chatId) === allowed;
}

async function callApi(
  method: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  const botToken = token();
  if (!botToken) return false;

  try {
    const res = await fetch(`${API}/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Telegram ${method} failed:`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Telegram ${method} error:`, err);
    return false;
  }
}

function attachReplyOptions(
  body: Record<string, unknown>,
  options?: {
    replyMarkup?: { inline_keyboard: InlineButton[][] };
    replyToMessageId?: number;
    forceReply?: boolean;
  },
) {
  if (options?.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  } else if (options?.forceReply) {
    body.reply_markup = {
      force_reply: true,
      selective: false,
    };
  }

  if (options?.replyToMessageId != null) {
    body.reply_parameters = { message_id: options.replyToMessageId };
  }
}

async function sendClassicMessage(
  chatId: string | number,
  text: string,
  options?: {
    replyMarkup?: { inline_keyboard: InlineButton[][] };
    replyToMessageId?: number;
    forceReply?: boolean;
    parseMode?: "HTML" | "MarkdownV2";
  },
): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
  };
  if (options?.parseMode) {
    body.parse_mode = options.parseMode;
  }
  attachReplyOptions(body, options);
  return callApi("sendMessage", body);
}

async function sendRichMarkdownMessage(
  chatId: string | number,
  markdown: string,
  options?: {
    replyMarkup?: { inline_keyboard: InlineButton[][] };
    replyToMessageId?: number;
    forceReply?: boolean;
  },
): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    rich_message: {
      markdown: stripOuterCodeFence(markdown),
    },
  };
  attachReplyOptions(body, options);
  return callApi("sendRichMessage", body);
}

/**
 * Pošle správu. Predvolene Rich Markdown (nadpisy, tučné, zoznamy).
 * format: "html" = klasický HTML, "plain" = bez parse_mode (napr. BLK markery).
 */
export async function sendTelegramMessage(
  text: string,
  options?: {
    chatId?: string | number;
    replyMarkup?: { inline_keyboard: InlineButton[][] };
    replyToMessageId?: number;
    forceReply?: boolean;
    format?: TelegramTextFormat;
  },
): Promise<boolean> {
  const chatId = options?.chatId ?? telegramChatId();
  if (!chatId) return false;

  const format = options?.format ?? "rich";
  const replyOpts = {
    replyMarkup: options?.replyMarkup,
    replyToMessageId: options?.replyToMessageId,
    forceReply: options?.forceReply,
  };

  if (format === "plain") {
    return sendClassicMessage(chatId, text, replyOpts);
  }

  if (format === "html") {
    return sendClassicMessage(chatId, text, {
      ...replyOpts,
      parseMode: "HTML",
    });
  }

  // rich: najprv sendRichMessage, pri zlyhaní HTML fallback
  const richOk = await sendRichMarkdownMessage(chatId, text, replyOpts);
  if (richOk) return true;

  console.warn(
    "Telegram sendRichMessage zlyhalo, skúšam HTML fallback (sendMessage).",
  );
  return sendClassicMessage(chatId, markdownToTelegramHtml(text), {
    ...replyOpts,
    parseMode: "HTML",
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<boolean> {
  return callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text ?? undefined,
    show_alert: false,
  });
}

export async function editMessageReplyMarkup(
  chatId: number | string,
  messageId: number,
): Promise<boolean> {
  return callApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

/** Inline klávesnica pre ranné pripomenutie bloku. */
export function blockReminderKeyboard(blockId: number) {
  return {
    inline_keyboard: [
      [
        { text: "✔️ Odfajknúť", callback_data: `close:${blockId}` },
        { text: "💬 Dopísať", callback_data: `note:${blockId}` },
      ],
    ],
  };
}

/** Marker v správe, aby reply vedel, ku ktorému bloku patrí poznámka. */
export function notePromptMarker(blockId: number): string {
  return `BLK:${blockId}`;
}

export function parseBlockIdFromNotePrompt(text: string): number | null {
  const match = text.match(/\bBLK:(\d+)\b/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseCallbackData(
  data: string,
): { action: "close" | "note"; blockId: number } | null {
  const match = data.match(/^(close|note):(\d+)$/);
  if (!match) return null;
  const blockId = Number(match[2]);
  if (!Number.isInteger(blockId) || blockId <= 0) return null;
  return {
    action: match[1] as "close" | "note",
    blockId,
  };
}

export function formatBlockReminder(block: {
  id: number;
  title: string;
  body: string | null;
  severity: number | null;
  reminderCount: number;
}): string {
  const sev =
    block.severity === 1
      ? "🔴 vysoká"
      : block.severity === 2
        ? "🟡 stredná"
        : block.severity === 3
          ? "🟢 nízka"
          : null;

  const lines = [
    "# 🧱 Aktívny blok",
    "",
    `## ${block.title}`,
  ];
  if (block.body) {
    lines.push("", block.body);
  }
  if (sev) lines.push("", `**Priorita:** ${sev}`);
  lines.push(`**Pripomenutí:** ${block.reminderCount + 1}`);
  // Marker: odpoveď na túto správu uloží poznámku (aj bez tlačidla Dopísať).
  // V plain formáte, aby reply_to_message.text obsahoval BLK:id.
  lines.push("", notePromptMarker(block.id));
  return lines.join("\n");
}

/** Potvrdenie uzavretia bloku (Rich Markdown). */
export function formatBlockClosedMessage(title: string): string {
  return formatSystemNotice("Hotovo", `„${title}“ je vyriešený.`, "✅");
}

/** Výzva na poznámku k bloku. Marker musí byť čitateľný v reply texte. */
export function formatNotePromptMessage(blockId: number): string {
  return [
    "## 💬 Dopíš poznámku",
    "",
    "Odpovedz na túto správu a poznámka sa uloží k bloku.",
    "",
    notePromptMarker(blockId),
  ].join("\n");
}
