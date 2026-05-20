import { db } from './db';
import {
  goldPrices,
  economicIndicators,
  sentimentData,
  recommendations,
  geopoliticalEvents,
  notifications,
} from './schema';
import { desc } from 'drizzle-orm';

const GOLD_API_KEY = process.env.GOLD_API_KEY;           // Metals.dev / GoldAPI.io
const COMMODITY_API_KEY = process.env.COMMODITY_API_KEY; // commoditypriceapi.com (best real-time)
const TROY_OZ_TO_GRAM = 31.1034768;

// ---- Real-time Spot API: CommodityPriceAPI (free trial, no card) ----
// Sign up: https://commoditypriceapi.com/gold-price → get key → set COMMODITY_API_KEY in .env
export async function fetchCommodityPrice(): Promise<number | null> {
  if (!COMMODITY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.commoditypriceapi.com/v2/rates/latest/xau?quote=USD`,
      { headers: { 'X-API-Key': COMMODITY_API_KEY } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data?.success && typeof data?.rates?.XAU?.rate === 'number') {
      return Number(data.rates.XAU.rate.toFixed(2));
    }
    return null;
  } catch (err) {
    console.error('[Fetcher] CommodityPriceAPI error:', err);
    return null;
  }
}

// ---- Free API: FreeGoldAPI (no key required, may be delayed ~days) ----
export async function fetchFreeGoldPrice(): Promise<number | null> {
  try {
    const res = await fetch('https://freegoldapi.com/data/latest.json', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      date: string;
      price: number;
      source: string;
    }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[data.length - 1];
    if (typeof latest.price === 'number' && latest.price > 1000) {
      return Number(latest.price.toFixed(2));
    }
    return null;
  } catch (err) {
    console.error('[Fetcher] FreeGoldAPI error:', err);
    return null;
  }
}

// ---- Paid API: Metals.dev (requires key) ----
export async function fetchMetalsDevPrice(): Promise<number | null> {
  if (!GOLD_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.metals.dev/v1/latest?api_key=${encodeURIComponent(
        GOLD_API_KEY
      )}&currency=USD&unit=toz`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data?.status === 'success' && typeof data?.metals?.gold === 'number') {
      return Number(data.metals.gold.toFixed(2));
    }
    if (typeof data?.gold === 'number') return Number(data.gold.toFixed(2));
    return null;
  } catch (err) {
    console.error('[Fetcher] Metals.dev error:', err);
    return null;
  }
}

// ---- Try real-time first, then free, then paid, then fallback ----
export async function fetchRealGoldPrice(): Promise<{ price: number | null; source: string; warning?: string }> {
  // 1. Best real-time spot price
  const commodity = await fetchCommodityPrice();
  if (commodity) return { price: commodity, source: 'commoditypriceapi.com' };

  // 2. Free historical (may be delayed)
  const free = await fetchFreeGoldPrice();
  if (free) return { price: free, source: 'freegoldapi.com', warning: 'Data may be delayed by several days' };

  // 3. Paid API
  const paid = await fetchMetalsDevPrice();
  if (paid) return { price: paid, source: 'metals.dev' };

  // No APIs available
  return {
    price: null,
    source: 'none',
    warning: 'No live API key configured. Add COMMODITY_API_KEY (recommended) or GOLD_API_KEY to .env for real-time prices.',
  };
}

// ---- Conversions ----
export function ozToGram(priceOz: number): number {
  return priceOz / TROY_OZ_TO_GRAM;
}
export function convertFx(priceUsd: number, currency: string): number {
  const rates: Record<string, number> = {
    USD: 1, AED: 3.67, EGP: 49.5, EUR: 0.92, GBP: 0.78,
    SAR: 3.75, KWD: 0.307, QAR: 3.64, OMR: 0.384, BHD: 0.376,
  };
  return priceUsd * (rates[currency] ?? 1);
}
export function formatGoldPrice(
  priceOzUsd: number,
  opts: { unit?: 'oz' | 'g'; currency?: string } = {}
): { value: number; label: string; unit: string; currency: string } {
  const unit = opts.unit ?? 'oz';
  const currency = opts.currency ?? 'USD';
  let value = priceOzUsd;
  if (unit === 'g') value = ozToGram(priceOzUsd);
  if (currency !== 'USD') value = convertFx(value, currency);
  return {
    value: Number(value.toFixed(2)),
    label: `${currency}/${unit}`,
    unit,
    currency,
  };
}

// ---- Mock fallback for demo ----
export function generateMockPrice(lastPrice: number | null): number {
  const base = lastPrice ?? 3300;
  const drift = (Math.random() - 0.5) * 8;
  const shock = Math.random() > 0.96 ? (Math.random() - 0.5) * 45 : 0;
  const meanReversion = base > 3400 ? -1.5 : base < 3100 ? 1.5 : 0;
  let next = base + drift + shock + meanReversion;
  next = Math.max(2800, Math.min(3800, next));
  return Number(next.toFixed(2));
}

export function calculateFearGreed(prices: number[]): number {
  if (prices.length < 5) return 50;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const last = prices[prices.length - 1];
  const diff = ((last - avg) / avg) * 100;
  let index = 50 + diff * 8;
  return Math.max(0, Math.min(100, Math.round(index)));
}

export function generateRecommendation(
  fearGreed: number,
  latestPrice: number,
  prices: number[]
): { action: string; confidence: number; reasoning: string } {
  const volatility =
    prices.length > 1
      ? Math.abs(prices[prices.length - 1] - prices[prices.length - 2])
      : 0;
  const trend =
    prices.length > 5
      ? prices[prices.length - 1] - prices[prices.length - 5]
      : 0;

  if (fearGreed < 20) {
    return {
      action: 'BUY',
      confidence: Math.round(85 + Math.random() * 10),
      reasoning: `Extreme fear (${fearGreed}/100). Possible capitulation. Price $${latestPrice.toFixed(
        2
      )}. Accumulate cautiously.`,
    };
  } else if (fearGreed < 40) {
    return {
      action: 'BUY',
      confidence: Math.round(65 + Math.random() * 10),
      reasoning: `Market fear (${fearGreed}/100) with ${
        trend > 0 ? 'early recovery' : 'downtrend'
      } signs. Price $${latestPrice.toFixed(2)}.`,
    };
  } else if (fearGreed > 80) {
    return {
      action: 'SELL',
      confidence: Math.round(80 + Math.random() * 10),
      reasoning: `Extreme greed (${fearGreed}/100). Euphoria risk. Price $${latestPrice.toFixed(
        2
      )}. Consider profit-taking.`,
    };
  } else if (fearGreed > 60) {
    return {
      action: 'HOLD',
      confidence: Math.round(70 + Math.random() * 10),
      reasoning: `Elevated greed (${fearGreed}/100). Trend +$${trend.toFixed(
        2
      )}. Hold existing positions, avoid new entries at $${latestPrice.toFixed(2)}.`,
    };
  } else {
    return {
      action: 'HOLD',
      confidence: Math.round(50 + Math.random() * 10),
      reasoning: `Neutral sentiment (${fearGreed}/100). Volatility $${volatility.toFixed(
        2
      )}. Wait for clearer direction at $${latestPrice.toFixed(2)}.`,
    };
  }
}

export function createNotification(
  type: string,
  title: string,
  message: string
) {
  db.insert(notifications)
    .values({ type, title, message, read: false })
    .run();
}

function checkAndNotifyRecommendationChange(
  newRec: { action: string; confidence: number },
  prevRec: { action: string; confidence: number } | undefined
) {
  if (!prevRec) return;

  if (newRec.action !== prevRec.action) {
    createNotification(
      'recommendation_change',
      `Signal Changed: ${prevRec.action} → ${newRec.action}`,
      `The trading signal shifted from ${prevRec.action} to ${newRec.action}. Confidence: ${newRec.confidence}%. Review your positions.`
    );
    return;
  }

  const confidenceDelta = Math.abs(newRec.confidence - prevRec.confidence);
  if (confidenceDelta >= 15) {
    createNotification(
      'sentiment_shift',
      `${newRec.action} Confidence ${newRec.confidence > prevRec.confidence ? 'Surged' : 'Dropped'}`,
      `Confidence for ${newRec.action} moved from ${prevRec.confidence}% to ${newRec.confidence}% (${confidenceDelta.toFixed(0)}% change).`
    );
  }
}

export async function runAutoUpdate() {
  const now = new Date();
  console.log(`[AutoUpdate] Running at ${now.toISOString()}`);

  const apiResult = await fetchRealGoldPrice();
  const lastRow = db
    .select({ priceUsd: goldPrices.priceUsd })
    .from(goldPrices)
    .orderBy(desc(goldPrices.id))
    .limit(1)
    .get();
  const lastPrice = lastRow?.priceUsd ?? null;

  let price: number;
  let source: string;

  if (apiResult.price !== null) {
    price = apiResult.price;
    source = apiResult.source;
    if (apiResult.warning) {
      console.log(`[AutoUpdate] WARNING: ${apiResult.warning}`);
    }
  } else {
    price = generateMockPrice(lastPrice);
    source = apiResult.source === 'none' ? 'simulation (no API key)' : 'simulation';
    if (apiResult.warning) {
      console.log(`[AutoUpdate] WARNING: ${apiResult.warning}`);
    }
  }

  db.insert(goldPrices)
    .values({ priceUsd: price, source })
    .run();

  // Price spike notification
  if (lastPrice !== null) {
    const priceChangePct = ((price - lastPrice) / lastPrice) * 100;
    if (Math.abs(priceChangePct) >= 1.5) {
      createNotification(
        'price_spike',
        `Gold Price ${priceChangePct > 0 ? 'Spike' : 'Drop'}: ${priceChangePct > 0 ? '+' : ''}${priceChangePct.toFixed(2)}%`,
        `Price moved from $${lastPrice.toFixed(2)} to $${price.toFixed(2)} (source: ${source}).`
      );
    }
  }

  // Economic indicators
  db.insert(economicIndicators)
    .values([
      {
        name: 'US Dollar Index (DXY)',
        value: Number((100 + (Math.random() - 0.5) * 8).toFixed(2)),
        unit: 'index',
      },
      {
        name: 'US 10Y Treasury Yield',
        value: Number((4.2 + (Math.random() - 0.5) * 1.2).toFixed(2)),
        unit: '%',
      },
      {
        name: 'CPI Inflation (YoY)',
        value: Number((3.2 + (Math.random() - 0.5) * 1.5).toFixed(2)),
        unit: '%',
      },
      {
        name: 'Real Interest Rate',
        value: Number((1.5 + (Math.random() - 0.5) * 1.0).toFixed(2)),
        unit: '%',
      },
    ])
    .run();

  // Occasional geopolitical event
  if (Math.random() > 0.85) {
    const events = [
      {
        title: 'Central Bank Gold Purchase',
        description:
          'A major central bank announced an increase in gold reserves.',
        impactScore: 6,
      },
      {
        title: 'Geopolitical Tensions Rise',
        description:
          'Conflict escalation in a resource-rich region boosted safe-haven demand.',
        impactScore: 7,
      },
      {
        title: 'Fed Rate Decision',
        description:
          'Federal Reserve signaled potential rate cuts later this year.',
        impactScore: 5,
      },
      {
        title: 'Mining Supply Disruption',
        description:
          'Labor strike at a major gold mine threatens near-term supply.',
        impactScore: 4,
      },
      {
        title: 'Currency Devaluation',
        description:
          'Emerging market currency weakened sharply, increasing local gold demand.',
        impactScore: 3,
      },
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    db.insert(geopoliticalEvents).values(ev).run();

    createNotification(
      'geopolitical_event',
      ev.title,
      ev.description ?? 'A new geopolitical event may impact gold prices.'
    );
  }

  // Recalculate sentiment from last 30 prices
  const recent = db
    .select({ priceUsd: goldPrices.priceUsd })
    .from(goldPrices)
    .orderBy(desc(goldPrices.id))
    .limit(30)
    .all();
  const recentPrices = recent.map((r) => r.priceUsd).reverse();
  const fg = calculateFearGreed(recentPrices);
  let label = 'Neutral';
  if (fg <= 20) label = 'Extreme Fear';
  else if (fg <= 40) label = 'Fear';
  else if (fg >= 80) label = 'Extreme Greed';
  else if (fg >= 60) label = 'Greed';

  db.insert(sentimentData)
    .values({ fearGreedIndex: fg, sentimentLabel: label })
    .run();

  // Recommendation + notification logic
  const prevRec = db
    .select({ action: recommendations.action, confidence: recommendations.confidence })
    .from(recommendations)
    .orderBy(desc(recommendations.id))
    .limit(1)
    .get();

  const rec = generateRecommendation(fg, price, recentPrices);
  db.insert(recommendations)
    .values({
      action: rec.action,
      confidence: rec.confidence,
      reasoning: rec.reasoning,
    })
    .run();

  checkAndNotifyRecommendationChange(rec, prevRec);

  console.log(
    `[AutoUpdate] Price=$${price.toFixed(2)} Source=${source} FearGreed=${fg} Rec=${rec.action}`
  );
}

export function startAutoUpdater(intervalMinutes = 5) {
  runAutoUpdate().catch(console.error);

  const ms = intervalMinutes * 60 * 1000;
  const timer = setInterval(() => {
    runAutoUpdate().catch(console.error);
  }, ms);

  console.log(`[AutoUpdater] Active. Interval = ${intervalMinutes} minute(s).`);
  return timer;
}
