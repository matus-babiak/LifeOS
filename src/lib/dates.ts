const TZ = "Europe/Bratislava";

/** Dnešný dátum v tvare RRRR-MM-DD v bratislavskom čase. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Aktuálna hodina (0–23) v bratislavskom čase. */
export function currentHour(): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
}

/** Večerný režim dashboardu začína o 18:00. */
export function isEvening(): boolean {
  return currentHour() >= 18;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Pondelok týždňa, do ktorého patrí daný deň. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = d.getUTCDay(); // 0 = nedeľa
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

/** 1 = pondelok … 7 = nedeľa */
export function isoWeekday(iso: string): number {
  const day = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function isWeekday(iso: string): boolean {
  return isoWeekday(iso) <= 5;
}

const DAY_NAMES = [
  "pondelok",
  "utorok",
  "streda",
  "štvrtok",
  "piatok",
  "sobota",
  "nedeľa",
];

const MONTH_NAMES_GENITIVE = [
  "januára",
  "februára",
  "marca",
  "apríla",
  "mája",
  "júna",
  "júla",
  "augusta",
  "septembra",
  "októbra",
  "novembra",
  "decembra",
];

/** „nedeľa 20. júla" */
export function formatHuman(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${DAY_NAMES[isoWeekday(iso) - 1]} ${d}. ${MONTH_NAMES_GENITIVE[m - 1]}`;
}
