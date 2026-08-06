import {
  getOldestOpenBlock,
  markBlockNotified,
} from "@/lib/active-blocks";
import {
  blockReminderKeyboard,
  formatBlockReminder,
  sendTelegramMessage,
  telegramConfigured,
} from "@/lib/telegram";

export const runtime = "nodejs";

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** Vercel Cron: ranné pripomenutie najstaršieho otvoreného aktívneho bloku. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET nie je nastavený" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  if (!telegramConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "TELEGRAM_BOT_TOKEN alebo TELEGRAM_CHAT_ID chýba",
      },
      { status: 500 },
    );
  }

  const block = await getOldestOpenBlock();
  if (!block) {
    return Response.json({ ok: true, sent: false, reason: "no_open_blocks" });
  }

  const sent = await sendTelegramMessage(formatBlockReminder(block), {
    replyMarkup: blockReminderKeyboard(block.id),
  });

  if (!sent) {
    return Response.json(
      { ok: false, error: "telegram_send_failed" },
      { status: 502 },
    );
  }

  await markBlockNotified(block.id);

  return Response.json({
    ok: true,
    sent: true,
    blockId: block.id,
    title: block.title,
  });
}
