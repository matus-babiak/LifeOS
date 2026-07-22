import { Sparkles } from "lucide-react";
import { getMentorMessage, type getTodayView } from "@/db/queries";

export default async function DailyMentor({
  view,
  trainingSteps,
}: {
  view: Awaited<ReturnType<typeof getTodayView>>;
  trainingSteps: string[];
}) {
  const message = await getMentorMessage(view, trainingSteps);
  if (!message) return null;

  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <p className="text-sm text-accent-ink">{message}</p>
      </div>
    </section>
  );
}
