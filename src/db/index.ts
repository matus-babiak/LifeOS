import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

// Lokálny vývoj beží na PGlite (vstavaný Postgres v ./.pglite),
// produkcia na Vercel vyžaduje DATABASE_URL (Neon).
export type Db = PgliteDatabase<typeof schema>;

declare global {
  var __lifeosDb: Db | undefined;
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzleNeon(neon(url), { schema }) as unknown as Db;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL musí byť nastavená v produkcii");
  }
  return drizzlePglite("./.pglite", { schema });
}

function getDb(): Db {
  return (globalThis.__lifeosDb ??= createDb());
}

// Lenivá inicializácia - pripojenie vzniká až pri prvom dopyte,
// nie pri importe (ten beží aj počas `next build`).
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
