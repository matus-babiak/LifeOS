import AttentionItemCard from "@/components/AttentionItemCard";
import NewAttentionForm from "@/components/NewAttentionForm";
import { getAttentionView } from "@/db/queries";
import type { attentionItems } from "@/db/schema";

export const metadata = { title: "Pozornosť" };

type Item = typeof attentionItems.$inferSelect;
type Area = { id: number; name: string };

function Column({
  title,
  description,
  bucket,
  items,
  areas,
  areaById,
  addLabel,
}: {
  title: string;
  description: string;
  bucket: "now" | "later";
  items: Item[];
  areas: Area[];
  areaById: Map<number, { id: number; name: string }>;
  addLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </header>
      <NewAttentionForm bucket={bucket} areas={areas} label={addLabel} />
      {items.length === 0 ? (
        <p className="text-sm text-muted">Zatiaľ prázdne.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <AttentionItemCard
                item={item}
                areaName={
                  item.areaId != null
                    ? (areaById.get(item.areaId)?.name ?? null)
                    : null
                }
                areas={areas}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AttentionPage() {
  const { now, later, areas, areaById } = await getAttentionView();
  const areaOptions = areas.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pozornosť</h1>
        <p className="mt-1 text-sm text-muted">
          Porovnaj, kam reálne ide tvoja energia, s tým, čo je dôležité, ale
          zatiaľ to odkladáš.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <Column
          title="Aktuálne dávam energiu"
          description="Čomu venujem čas a pozornosť teraz."
          bucket="now"
          items={now}
          areas={areaOptions}
          areaById={areaById}
          addLabel="Pridať do Aktuálne"
        />
        <Column
          title="Odkladám / Budúcnosť"
          description="Čo považujem za dôležité, ale momentálne to nie je v hre."
          bucket="later"
          items={later}
          areas={areaOptions}
          areaById={areaById}
          addLabel="Pridať do Odkladám"
        />
      </div>
    </div>
  );
}
