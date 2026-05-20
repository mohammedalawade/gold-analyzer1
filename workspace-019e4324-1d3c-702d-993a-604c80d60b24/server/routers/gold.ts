import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import {
  goldPrices,
  economicIndicators,
  sentimentData,
  recommendations,
  geopoliticalEvents,
  notifications,
} from '../schema';
import { desc, eq, sql } from 'drizzle-orm';
import {
  formatGoldPrice,
  calculateFearGreed,
  generateRecommendation,
} from '../fetcher';

export const goldRouter = router({
  getStatus: publicProcedure.query(() => {
    return {
      hasCommodityKey: !!process.env.COMMODITY_API_KEY,
      hasMetalsKey: !!process.env.METALS_API_KEY,
      hasGoldKey: !!process.env.GOLD_API_KEY,
      usingRealApi: !!(process.env.COMMODITY_API_KEY || process.env.METALS_API_KEY || process.env.GOLD_API_KEY),
      livePriceAvailable: !!process.env.COMMODITY_API_KEY,
    };
  }),

  getLatestPrice: publicProcedure.query(() => {
    return (
      db
        .select()
        .from(goldPrices)
        .orderBy(desc(goldPrices.id))
        .limit(1)
        .get() ?? null
    );
  }),

  getPriceHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(1000).default(200) }))
    .query(({ input }) => {
      return db
        .select()
        .from(goldPrices)
        .orderBy(desc(goldPrices.id))
        .limit(input.limit)
        .all()
        .reverse();
    }),

  getPriceWithConversion: publicProcedure
    .input(
      z.object({
        unit: z.enum(['oz', 'g']).default('oz'),
        currency: z.enum(['USD', 'AED', 'EGP', 'EUR', 'GBP', 'SAR', 'KWD', 'QAR', 'OMR', 'BHD']).default('USD'),
      })
    )
    .query(({ input }) => {
      const latest =
        db
          .select()
          .from(goldPrices)
          .orderBy(desc(goldPrices.id))
          .limit(1)
          .get() ?? null;
      if (!latest) return null;
      const converted = formatGoldPrice(latest.priceUsd, {
        unit: input.unit,
        currency: input.currency,
      });
      return {
        ...latest,
        displayValue: converted.value,
        displayLabel: converted.label,
        displayUnit: converted.unit,
        displayCurrency: converted.currency,
      };
    }),

  // ---- MANUAL PRICE UPDATE (for real market price) ----
  updatePrice: publicProcedure
    .input(
      z.object({
        priceUsd: z.number().min(100).max(20000),
        source: z.string().default('manual'),
      })
    )
    .mutation(({ input }) => {
      db.insert(goldPrices)
        .values({
          priceUsd: Number(input.priceUsd.toFixed(2)),
          source: input.source,
          createdAt: new Date(),
        })
        .run();

      // Recalculate sentiment & recommendation immediately
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

      const rec = generateRecommendation(fg, input.priceUsd, recentPrices);
      db.insert(recommendations)
        .values({
          action: rec.action,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
        })
        .run();

      return {
        success: true,
        priceUsd: input.priceUsd,
        fearGreed: fg,
        sentimentLabel: label,
        recommendation: rec.action,
      };
    }),

  getEconomicIndicators: publicProcedure.query(() => {
    const rows = db
      .select()
      .from(economicIndicators)
      .orderBy(desc(economicIndicators.id))
      .limit(20)
      .all();
    const map = new Map<string, (typeof rows)[0]>();
    for (const r of rows) {
      if (!map.has(r.name)) map.set(r.name, r);
    }
    return Array.from(map.values());
  }),

  getGeopoliticalEvents: publicProcedure.query(() => {
    return db
      .select()
      .from(geopoliticalEvents)
      .orderBy(desc(geopoliticalEvents.id))
      .limit(10)
      .all();
  }),

  getSentiment: publicProcedure.query(() => {
    return (
      db
        .select()
        .from(sentimentData)
        .orderBy(desc(sentimentData.id))
        .limit(1)
        .get() ?? null
    );
  }),

  getRecommendations: publicProcedure.query(() => {
    return db
      .select()
      .from(recommendations)
      .orderBy(desc(recommendations.id))
      .limit(5)
      .all();
  }),

  getStats: publicProcedure.query(() => {
    const prices = db
      .select({ priceUsd: goldPrices.priceUsd, source: goldPrices.source })
      .from(goldPrices)
      .orderBy(desc(goldPrices.id))
      .limit(30)
      .all();
    if (prices.length === 0) return null;
    const values = prices.map((p) => p.priceUsd);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[0];
    const prev = values[1] ?? latest;
    const change = latest - prev;
    const changePct = prev !== 0 ? (change / prev) * 100 : 0;
    const latestSource = prices[0]?.source ?? 'unknown';

    return {
      avg: Number(avg.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      latest: Number(latest.toFixed(2)),
      latestOzUsd: Number(latest.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePct: Number(changePct.toFixed(2)),
      count: values.length,
      latestSource,
      latestGramUsd: formatGoldPrice(latest, { unit: 'g', currency: 'USD' }).value,
      latestGramAed: formatGoldPrice(latest, { unit: 'g', currency: 'AED' }).value,
      latestGramEgp: formatGoldPrice(latest, { unit: 'g', currency: 'EGP' }).value,
      latestGramSar: formatGoldPrice(latest, { unit: 'g', currency: 'SAR' }).value,
    };
  }),

  // Notifications
  getNotifications: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(({ input }) => {
      return db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .all();
    }),

  getUnreadCount: publicProcedure.query(() => {
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.read, false))
      .get();
    return result?.count ?? 0;
  }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input.id))
        .run();
      return { success: true };
    }),

  markAllAsRead: publicProcedure.mutation(() => {
    db.update(notifications).set({ read: true }).run();
    return { success: true };
  }),
});
