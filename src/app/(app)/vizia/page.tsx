import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import NewGoalForm from "@/components/NewGoalForm";
import VisionEditor from "@/components/VisionEditor";
import { getVisionView } from "@/db/queries";

export const metadata = { title: "Vízia a ciele" };

export default async function VisionPage({
  searchParams,
}: {
  searchParams: Promise<{ oblast?: string }>;
}) {
  const { oblast } = await searchParams;
  const { contentByHorizon, goals, areas } = await getVisionView();

  const areaFilter = oblast
    ? areas.find((a) => a.slug === oblast) ?? null
    : null;
  const filtered = areaFilter
    ? goals.filter((g) => g.areaId === areaFilter.id)
    : goals;

  const openGoals = filtered.filter((g) => !g.doneAt);
  const doneGoals = filtered.filter((g) => !!g.doneAt);
  const areasInUse = areas.filter((a) =>
    goals.some((g) => g.areaId === a.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Vízia a ciele</h1>
        <p className="mt-1 text-sm text-muted">
          Dlhodobá vízia a ciele, ktoré chceš v oblastiach života zmeniť.
        </p>
      </header>

      <VisionEditor
        horizon="1y"
        title="O 1 rok"
        content={contentByHorizon.get("1y") ?? null}
      />
      <VisionEditor
        horizon="5y"
        title="O 5 rokov"
        content={contentByHorizon.get("5y") ?? null}
      />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-medium">Ciele</h2>
          <p className="mt-1 text-sm text-muted">
            Pri vytvorení priraď oblasť a termín. Môžeš upravovať, mazať a
            označiť ako dosiahnuté.
          </p>
        </div>

        <NewGoalForm
          areas={areas.map((a) => ({ id: a.id, name: a.name }))}
          defaultAreaId={areaFilter?.id}
        />

        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/vizia"
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                !areaFilter
                  ? "bg-accent-soft text-accent-ink"
                  : "border border-line text-muted hover:text-ink"
              }`}
            >
              Všetky
            </Link>
            {areasInUse.map((a) => (
              <Link
                key={a.id}
                href={`/vizia?oblast=${a.slug}`}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  areaFilter?.id === a.id
                    ? "text-accent-ink"
                    : "border border-line text-muted hover:text-ink"
                }`}
                style={
                  areaFilter?.id === a.id
                    ? { backgroundColor: `${a.color}22` }
                    : undefined
                }
              >
                {a.name}
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-muted">
            {areaFilter
              ? "V tejto oblasti zatiaľ žiadne ciele."
              : "Zatiaľ žiadne ciele. Pridaj prvý vyššie."}
          </p>
        )}

        {openGoals.length > 0 && (
          <div className="flex flex-col gap-3">
            {openGoals.map((g) => (
              <GoalCard
                key={g.id}
                goal={{
                  id: g.id,
                  areaId: g.areaId,
                  title: g.title,
                  dueDate: g.dueDate,
                  doneAt: g.doneAt ? g.doneAt.toISOString() : null,
                  areaName: g.areaName,
                  areaColor: g.areaColor,
                }}
                areas={areas.map((a) => ({ id: a.id, name: a.name }))}
              />
            ))}
          </div>
        )}

        {doneGoals.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted">
              Dosiahnuté ({doneGoals.length})
            </h3>
            {doneGoals.map((g) => (
              <GoalCard
                key={g.id}
                goal={{
                  id: g.id,
                  areaId: g.areaId,
                  title: g.title,
                  dueDate: g.dueDate,
                  doneAt: g.doneAt ? g.doneAt.toISOString() : null,
                  areaName: g.areaName,
                  areaColor: g.areaColor,
                }}
                areas={areas.map((a) => ({ id: a.id, name: a.name }))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
