// Na Verceli musí byť DATABASE_URL dostupná už pri builde,
// inak drizzle-kit push syncne len dočasnú PGlite a produkčný Neon ostane pozadu.
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL chýba pri Vercel builde. Nastav ju pre Production (Build + Runtime).",
  );
  process.exit(1);
}
