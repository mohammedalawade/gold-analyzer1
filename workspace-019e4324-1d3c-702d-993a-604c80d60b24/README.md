# Gold Psychology Analyzer

منصة تحليل الدورة النفسية للذهب — A fullstack dashboard for gold market sentiment, cycle analysis, and smart trading recommendations.

## Features
- **Auto-updating gold prices** every 5 minutes (backend fetcher + frontend polling)
- **Real-time gold spot price** via external API (with fallback to free delayed API or simulation)
- **Fear & Greed Index** calculated from short-term price momentum
- **Smart Recommendations** (BUY / HOLD / SELL) with confidence scores
- **Multi-currency display** (USD, AED, EGP, SAR per gram)
- **Macro Indicators** (DXY, Treasury yields, inflation)
- **Geopolitical Events** feed
- **Notification system** — Toast popups + bell dropdown for price spikes, recommendation changes, sentiment shifts, and geopolitical events
- **Manual price override** — Enter today's real price if you don't have an API key
- Dark luxury UI with gold accents

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- tRPC + Express
- Drizzle ORM + better-sqlite3
- Recharts
- Vitest

## Quick Start

```bash
npm install
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Getting Real-Time Gold Prices

By default, the app uses **FreeGoldAPI** (free, no key) but data may be **delayed by several days**.

For **true real-time spot prices** (refreshed every second from global exchanges), get a free API key:

### Option 1: CommodityPriceAPI.com (Recommended)
1. Visit https://commoditypriceapi.com/gold-price
2. Sign up for a **free trial** (no credit card)
3. Copy your API key
4. Create `.env` file:
```bash
COMMODITY_API_KEY=your_key_here
PORT=3001
```
5. Restart the server → you'll see **"Live API"** green badge instantly

### Option 2: Metals.dev
```bash
METALS_API_KEY=your_key_here
```

### Option 3: GoldAPI.io
```bash
GOLD_API_KEY=your_key_here
```

## Manual Price Override (No API key)

If you don't have an API key, click the **"Update Price"** button in the top navbar and enter today's real gold price in USD per troy ounce. The dashboard will recalculate instantly.

## Auto-Update Architecture
1. `server/fetcher.ts` runs a `setInterval` loop every **5 minutes**
2. Priority order:
   - **CommodityPriceAPI** (real-time spot, requires key)
   - **FreeGoldAPI** (free, no key, may be delayed)
   - **Metals.dev** (requires key)
   - **GoldAPI.io** (requires key)
   - **Simulation engine** (realistic random walk)
3. Each tick: saves price → updates indicators → recalculates sentiment → generates recommendation → creates notification if signal changed
4. Frontend uses **React Query** with `refetchInterval` to stay live

## Tests
```bash
npm test
```
