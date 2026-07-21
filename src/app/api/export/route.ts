import JSZip from "jszip";
import { getExportData } from "@/db/queries";
import { formatFileDate, todayISO } from "@/lib/dates";
import { buildDailyNote, buildWeeklyNote, vaultDailyPath, vaultWeeklyPath } from "@/lib/export";
import { requireUser } from "@/lib/session";

export async function GET() {
  await requireUser();

  const { days, weeks } = await getExportData();

  const zip = new JSZip();
  for (const day of days) {
    zip.file(vaultDailyPath(day.date), buildDailyNote(day));
  }
  for (const week of weeks) {
    zip.file(vaultWeeklyPath(week.weekStart), buildWeeklyNote(week));
  }

  const blob = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="LifeOS-export-${formatFileDate(todayISO())}.zip"`,
    },
  });
}
