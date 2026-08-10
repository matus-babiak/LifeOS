# LifeOS

Osobný operačný systém pre rast, sebarealizáciu a vedomé budovanie života.

> „Kým sa stávam a aké kroky ma k tomu každý deň približujú?"

Produktové rozhodnutia a plán etáp: [PRODUCT.md](PRODUCT.md)

AI development workflow (Knowledge Base, plan/implement agenti): [docs/ai/README.md](docs/ai/README.md)

## Lokálny vývoj

```bash
npm install
npm run db:push   # vytvorí tabuľky v lokálnej PGlite databáze (./.pglite)
npm run dev       # http://localhost:3000
```

Lokálne netreba nič nastavovať - `.env.local` má `AUTH_DISABLED=1` (bez prihlásenia)
a bez `DATABASE_URL` sa použije vstavaná PGlite databáza.

## Nasadenie na Vercel (jednorazový setup)

1. **Vercel projekt** - vercel.com → Add New Project → importuj repo `matus-babiak/LifeOS`.
2. **Databáza** - v projekte na Verceli: Storage → Create Database → **Neon (Postgres)**.
   Vercel automaticky doplní `DATABASE_URL` do env premenných.
3. **Env premenné na Verceli** (Settings → Environment Variables):
   - `AUTH_SECRET` - vygeneruj: `openssl rand -base64 32`
   - `APP_PASSWORD` - heslo do appky
   - `GEMINI_API_KEY` - voliteľné, pre AI mentora
   - `CRON_SECRET` - secret pre Vercel Cron (`openssl rand -base64 32`)
   - `TELEGRAM_BOT_TOKEN` - token od @BotFather
   - `TELEGRAM_CHAT_ID` - tvoje chat ID (napr. cez @userinfobot)
   - `TELEGRAM_WEBHOOK_SECRET` - voliteľné, ale odporúčané (rovnaký secret pri `setWebhook`)
4. **Telegram webhook** (po deployi):
   ```bash
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"https://<tvoja-domena>.vercel.app/api/telegram\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\"}"
   ```
   Bot príkazy: `/start`, `/new` (menu: myšlienka, poznámka, presvedčenie, cieľ).
   Cron `/api/cron/reminders` beží denne o 05:00 UTC (~07:00 SELČ / ~06:00 CET) a pošle top aktívny blok.
5. **Tabuľky v produkčnej DB** - `npm run build` na Verceli si pred `next build`
   automaticky spustí `drizzle-kit push --force`, takže schéma sa pri každom
   nasadení sama zosynchronizuje s `DATABASE_URL`. Ručný krok netreba.
6. Redeploy. Hotovo.

## Ikona do mobilu

**Stiahnuť obrázok ikony:** otvor v mobile [life-os-beta-pink.vercel.app/ikona](https://life-os-beta-pink.vercel.app/ikona)
a stiahni PNG (512 × 512 odporúčané). Ak tlačidlo nefunguje, podrž prst na
obrázku → Uložiť do Fotiek.

**Pridať appku na plochu (PWA):** Safari / Chrome → Zdieľať alebo menu →
**Pridať na plochu**. LifeOS sa potom otvára celoobrazovkovo ako natívna
aplikácia (manifest + apple-touch-icon sú súčasťou).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Drizzle ORM ·
Neon Postgres (produkcia) / PGlite (lokálne) · Auth.js (GitHub OAuth) · lucide-react
