import { isMorningFocusTime } from "@/lib/dates";
import { generateMorningInsight } from "@/lib/morning-insight";
import { saveMessageKeyboard } from "@/lib/telegram-capture";
import { sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import { formatMorningInsightMessage } from "@/lib/telegram-format";

export const runtime = "nodejs";

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/**
 * Vercel Cron: ranný fokus do Telegramu o 6:30 Europe/Bratislava.
 * Dva UTC schedule (04:30 a 05:30) pokrývajú letný/zimný čas; guard pustí len 6:30 BA.
 */
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

  if (!isMorningFocusTime()) {
    return Response.json({
      ok: true,
      sent: false,
      reason: "outside_bratislava_0630",
    });
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

  const result = await generateMorningInsight();
  if (!result.insight) {
    return Response.json({
      ok: true,
      sent: false,
      reason: result.reason ?? "no_insight",
      journalCount: result.journalCount,
      beliefCount: result.beliefCount,
    });
  }

  const message = formatMorningInsightMessage(result.insight);
  const sent = await sendTelegramMessage(message, {
    replyMarkup: saveMessageKeyboard(),
  });

  if (!sent) {
    return Response.json(
      { ok: false, error: "telegram_send_failed" },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    sent: true,
    journalCount: result.journalCount,
    beliefCount: result.beliefCount,
  });
}
