import { sql } from "drizzle-orm";
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
let schemaReady = false;

/**
 * Doplní schému, ak build-time drizzle push nesiahol na produkčný Neon.
 * Vytvorí `goals`, `progress_focus_items`, `ai_notes`, odstráni zastaranú `seasons` (schválené).
 */
export async function ensureSchema() {
  if (schemaReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS goals (
      id serial PRIMARY KEY,
      area_id integer NOT NULL REFERENCES areas(id),
      title text NOT NULL,
      due_date date NOT NULL,
      done_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS progress_focus_items (
      id serial PRIMARY KEY,
      title text NOT NULL,
      summary text NOT NULL,
      detail text NOT NULL,
      next_step text,
      status text NOT NULL DEFAULT 'active',
      fingerprint text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      accepted_at timestamp with time zone,
      done_at timestamp with time zone
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS progress_focus_items_fingerprint_uidx
    ON progress_focus_items (fingerprint)
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_notes (
      id serial PRIMARY KEY,
      category text NOT NULL,
      content text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`DROP TABLE IF EXISTS seasons`);
  schemaReady = true;
}

/** Pri prvom spustení naplní 6 oblastí života. Bezpečné volať opakovane. */
export async function ensureSeeded() {
  if (seeded) return;
  await ensureSchema();
  const existing = await db.select({ id: areas.id }).from(areas).limit(1);
  if (existing.length === 0) {
    await db.insert(areas).values(DEFAULT_AREAS).onConflictDoNothing();
  }
  seeded = true;
}
