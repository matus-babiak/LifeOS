/**
 * Formátovanie správ pre Telegram.
 * Preferuje Rich Markdown (sendRichMessage): **tučné**, # H1, ## H2, zoznamy.
 * Fallback: klasický HTML parse_mode (sendMessage).
 */

/** Escape pre klasický Telegram HTML (parse_mode: HTML). */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Odstráni markdown code fence okolo celej odpovede (Gemini občas pridá). */
export function stripOuterCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```$/i);
  return match ? match[1].trim() : trimmed;
}

/**
 * Prevedie bežný Markdown (vrátane Gemini výstupu) na Telegram HTML.
 * Používa sa ako fallback, keď sendRichMessage zlyhá.
 * Nadpisy # / ## mapuje na tučný riadok (klasický HTML nemá H1/H2).
 */
export function markdownToTelegramHtml(raw: string): string {
  const text = stripOuterCodeFence(raw);
  const lines = text.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      out.push(`<b>${inlineMarkdownToHtml(heading[2])}</b>`);
      continue;
    }

    const hr = line.match(/^(-{3,}|\*{3,}|_{3,})\s*$/);
    if (hr) {
      out.push("────────");
      continue;
    }

    const ul = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ul) {
      out.push(`${ul[1]}• ${inlineMarkdownToHtml(ul[2])}`);
      continue;
    }

    const ol = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ol) {
      out.push(`${ol[1]}${ol[2]}. ${inlineMarkdownToHtml(ol[3])}`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      out.push(`<blockquote>${inlineMarkdownToHtml(quote[1])}</blockquote>`);
      continue;
    }

    out.push(inlineMarkdownToHtml(line));
  }

  return out.join("\n");
}

/** Inline Markdown → Telegram HTML (po escape). */
function inlineMarkdownToHtml(line: string): string {
  let s = escapeTelegramHtml(line);

  // `code` pred bold/italic, aby hviezdičky v kóde nezasiahli
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");

  // **bold** / __bold__
  s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  s = s.replace(/__(.+?)__/g, "<b>$1</b>");

  // *italic* / _italic_ (až po **bold**, aby sa neprekryli)
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<i>$2</i>");
  s = s.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, "$1<i>$2</i>");

  // ~~strike~~
  s = s.replace(/~~(.+?)~~/g, "<s>$1</s>");

  return s;
}

/** Obalí ranný insight do peknej Rich Markdown šablóny. */
export function formatMorningInsightMessage(insight: string): string {
  const body = stripOuterCodeFence(insight);
  // Ak AI už dala vlastný nadpis, nezdvojuj
  if (/^#\s+/m.test(body)) {
    return body;
  }
  return [`# ☀️ Ranný fokus`, "", body].join("\n");
}

/** Systémové potvrdenia a krátke správy ako Rich Markdown. */
export function formatSystemNotice(
  title: string,
  body?: string,
  emoji = "✅",
): string {
  const lines = [`## ${emoji} ${title}`];
  if (body?.trim()) {
    lines.push("", body.trim());
  }
  return lines.join("\n");
}
