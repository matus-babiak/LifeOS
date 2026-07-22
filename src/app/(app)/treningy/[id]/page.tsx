import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle2,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import MilestoneCheckbox from "@/components/MilestoneCheckbox";
import { MentorSkeleton } from "@/components/Skeleton";
import TrainingEditor from "@/components/TrainingEditor";
import TrainingMentorNote from "@/components/TrainingMentorNote";
import { getTrainingDetail } from "@/db/queries";
import {
  addMilestone,
  deleteMilestone,
  deleteTraining,
  levelUp,
  setTrainingStatus,
} from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTrainingDetail(Number(id));
  return { title: detail?.training.name ?? "Tréning" };
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTrainingDetail(Number(id));
  if (!detail) notFound();

  const { training, area, milestones } = detail;
  const currentMs = milestones.filter((m) => m.level === training.level);
  const pastMs = milestones.filter((m) => m.level < training.level);
  const allCurrentDone =
    currentMs.length > 0 && currentMs.every((m) => m.done);
  const canLevelUp = allCurrentDone && training.level < 5;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/treningy"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Tréningy
        </Link>
      </div>

      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {training.name}
            </h1>
            {area && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${area.color}22`, color: area.color }}
              >
                {area.name}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`h-2 w-2 rounded-full ${n <= training.level ? "bg-accent" : "bg-line"}`}
                />
              ))}
            </span>
            <span className="text-sm text-muted">
              úroveň {training.level}/5
            </span>
          </div>
        </div>
      </header>

      {/* Mentorský komentár k tréningu */}
      <Suspense fallback={<MentorSkeleton />}>
        <TrainingMentorNote detail={detail} />
      </Suspense>

      {/* Úroveň a míľniky */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-medium">Úroveň {training.level}: míľniky</h2>
        <p className="mb-4 text-sm text-muted">
          Napíš si, čo pre teba táto úroveň konkrétne znamená. Keď splníš
          všetky míľniky, posunieš sa vyššie.
        </p>

        <ul className="flex flex-col gap-1">
          {currentMs.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1">
                <MilestoneCheckbox
                  id={m.id}
                  trainingId={training.id}
                  text={m.text}
                  done={m.done}
                />
              </div>
              <form action={deleteMilestone.bind(null, m.id, training.id)}>
                <button
                  type="submit"
                  aria-label="Zmazať míľnik"
                  className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form
          action={addMilestone.bind(null, training.id)}
          className="mt-3 flex gap-2"
        >
          <input
            name="text"
            type="text"
            placeholder="Pridať míľnik tejto úrovne"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            aria-label="Pridať míľnik"
            className="rounded-lg border border-line px-3 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        {training.level < 5 && (
          <form action={levelUp.bind(null, training.id)} className="mt-4">
            <button
              type="submit"
              disabled={!canLevelUp}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#10141a]"
            >
              <ArrowUp className="h-4 w-4" />
              Posunúť na úroveň {training.level + 1}
            </button>
            {!canLevelUp && (
              <p className="mt-2 text-xs text-muted">
                {currentMs.length === 0
                  ? "Najprv si pridaj aspoň jeden míľnik."
                  : "Splň všetky míľniky tejto úrovne."}
              </p>
            )}
          </form>
        )}
        {training.level >= 5 && allCurrentDone && (
          <p className="mt-4 flex items-center gap-2 text-sm text-accent-ink">
            <CheckCircle2 className="h-4 w-4" />
            Najvyššia úroveň zvládnutá.
          </p>
        )}
      </section>

      {/* Zámer (prečo / cieľ / denný krok) */}
      <TrainingEditor training={training} />

      {/* História míľnikov nižších úrovní */}
      {pastMs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">
            Zvládnuté míľniky
          </h2>
          <ul className="flex flex-col gap-1">
            {pastMs.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <Check className="h-3.5 w-3.5 text-accent" strokeWidth={3} />
                <span className="line-through">{m.text}</span>
                <span className="text-xs">úr. {m.level}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stav a mazanie */}
      <section className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {training.status === "active" ? (
          <form action={setTrainingStatus.bind(null, training.id, "paused")}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Pause className="h-4 w-4" />
              Pozastaviť
            </button>
          </form>
        ) : (
          <form action={setTrainingStatus.bind(null, training.id, "active")}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Play className="h-4 w-4" />
              Aktivovať
            </button>
          </form>
        )}
        {training.status !== "completed" && (
          <form action={setTrainingStatus.bind(null, training.id, "completed")}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <CheckCircle2 className="h-4 w-4" />
              Označiť ako dokončený
            </button>
          </form>
        )}
        <form action={deleteTraining.bind(null, training.id)} className="ml-auto">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
            Zmazať
          </button>
        </form>
      </section>
    </div>
  );
}
