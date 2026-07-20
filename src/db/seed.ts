import { db } from "./index";
import { areas } from "./schema";

const DEFAULT_AREAS = [
  {
    slug: "mysel-a-charakter",
    name: "Myseľ a charakter",
    description: "Disciplína, sebavedomie, trpezlivosť, odvaha, emócie, komunikácia",
    color: "#8b7bb8",
    icon: "Brain",
    position: 1,
  },
  {
    slug: "zdravie",
    name: "Zdravie",
    description: "Pohyb, strava, spánok, energia",
    color: "#6f9d6f",
    icon: "HeartPulse",
    position: 2,
  },
  {
    slug: "kariera",
    name: "Kariéra",
    description: "Odborné schopnosti, učenie, podnikanie, práca",
    color: "#5d87a8",
    icon: "Briefcase",
    position: 3,
  },
  {
    slug: "financie",
    name: "Financie",
    description: "Príjem, investície, finančné ciele",
    color: "#b08d4f",
    icon: "Wallet",
    position: 4,
  },
  {
    slug: "vztahy",
    name: "Vzťahy",
    description: "Partnerstvo, rodina, komunikácia, empatia",
    color: "#b07070",
    icon: "Heart",
    position: 5,
  },
  {
    slug: "hodnoty-a-duchovno",
    name: "Hodnoty a duchovno",
    description: "Meditácia, zmysel, vnútorný pokoj",
    color: "#7ba39d",
    icon: "Sparkles",
    position: 6,
  },
];

let seeded = false;

/** Pri prvom spustení naplní 6 oblastí života. Bezpečné volať opakovane. */
export async function ensureSeeded() {
  if (seeded) return;
  const existing = await db.select({ id: areas.id }).from(areas).limit(1);
  if (existing.length === 0) {
    await db.insert(areas).values(DEFAULT_AREAS).onConflictDoNothing();
  }
  seeded = true;
}
