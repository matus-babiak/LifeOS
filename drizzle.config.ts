import { defineConfig } from "drizzle-kit";

export default defineConfig(
  process.env.DATABASE_URL
    ? {
        dialect: "postgresql",
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dbCredentials: { url: process.env.DATABASE_URL },
      }
    : {
        dialect: "postgresql",
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        driver: "pglite",
        dbCredentials: { url: "./.pglite" },
      },
);
