import { Sparkles } from "lucide-react";
import { getTrainingMentorNote, type getTrainingDetail } from "@/db/queries";

export default async function TrainingMentorNote({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getTrainingDetail>>>;
}) {
  const note = await getTrainingMentorNote(detail);
  if (!note) return null;

  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <p className="text-sm text-accent-ink">{note}</p>
      </div>
    </section>
  );
}
