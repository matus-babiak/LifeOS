import { getWeekAiReflection, type getWeekView } from "@/db/queries";

export default async function WeekReflection({
  weekView,
}: {
  weekView: Awaited<ReturnType<typeof getWeekView>>;
}) {
  const reflection = await getWeekAiReflection(weekView);
  if (!reflection) return null;

  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
      <p className="text-sm text-accent-ink">{reflection}</p>
    </section>
  );
}
