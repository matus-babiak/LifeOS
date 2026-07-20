# LifeOS

Osobný operačný systém pre rast, sebarealizáciu a vedomé budovanie života.

> „Kým sa stávam a aké kroky ma k tomu každý deň približujú?"

Produktové rozhodnutia a plán etáp: [PRODUCT.md](PRODUCT.md)

## Lokálny vývoj

```bash
npm install
npm run db:push   # vytvorí tabuľky v lokálnej PGlite databáze (./.pglite)
npm run dev       # http://localhost:3000
```

Lokálne netreba nič nastavovať — `.env.local` má `AUTH_DISABLED=1` (bez prihlásenia)
a bez `DATABASE_URL` sa použije vstavaná PGlite databáza.

## Nasadenie na Vercel (jednorazový setup)

1. **Vercel projekt** — vercel.com → Add New Project → importuj repo `matus-babiak/LifeOS`.
2. **Databáza** — v projekte na Verceli: Storage → Create Database → **Neon (Postgres)**.
   Vercel automaticky doplní `DATABASE_URL` do env premenných.
3. **GitHub OAuth App** — github.com → Settings → Developer settings → OAuth Apps → New:
   - Application name: `LifeOS`
   - Homepage URL: `https://<tvoja-domena>.vercel.app`
   - Authorization callback URL: `https://<tvoja-domena>.vercel.app/api/auth/callback/github`
4. **Env premenné na Verceli** (Settings → Environment Variables):
   - `AUTH_GITHUB_ID` — Client ID z OAuth App
   - `AUTH_GITHUB_SECRET` — Client Secret z OAuth App
   - `AUTH_SECRET` — vygeneruj: `openssl rand -base64 32`
   - `ALLOWED_GITHUB_LOGIN` — `matus-babiak` (jediný účet, ktorý smie dnu)
5. **Tabuľky v produkčnej DB** — lokálne spusti:
   ```bash
   DATABASE_URL="<connection string z Vercel/Neon>" npm run db:push
   ```
6. Redeploy. Hotovo — appka je súkromná, pustí len tvoj GitHub účet.

## Ikona na ploche (iPhone)

Safari → otvor appku → Zdieľať → **Pridať na plochu**. LifeOS sa potom otvára
celoobrazovkovo ako natívna aplikácia (PWA manifest + apple-touch-icon sú súčasťou).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Drizzle ORM ·
Neon Postgres (produkcia) / PGlite (lokálne) · Auth.js (GitHub OAuth) · lucide-react
