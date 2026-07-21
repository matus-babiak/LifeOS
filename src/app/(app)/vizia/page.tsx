import SeasonPanel from "@/components/SeasonPanel";
import VisionEditor from "@/components/VisionEditor";
import { getVisionView } from "@/db/queries";

export const metadata = { title: "Vízia" };

export default async function VisionPage() {
  const { contentByHorizon, activeSeason, pastSeasons } = await getVisionView();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Vízia</h1>
        <p className="mt-1 text-sm text-muted">
          Kým sa stávam a v akej sezóne života práve som.
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

      <SeasonPanel activeSeason={activeSeason} pastSeasons={pastSeasons} />
    </div>
  );
}
