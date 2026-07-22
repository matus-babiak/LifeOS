import { Sparkles } from "lucide-react";
import { getBeliefReframe } from "@/db/queries";
import type { beliefs } from "@/db/schema";

export default async function BeliefReframe({
  belief,
}: {
  belief: typeof beliefs.$inferSelect;
}) {
  const reframe = await getBeliefReframe(belief);
  if (!reframe) return null;

  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft p-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
      <p className="text-sm text-accent-ink">{reframe}</p>
    </div>
  );
}
