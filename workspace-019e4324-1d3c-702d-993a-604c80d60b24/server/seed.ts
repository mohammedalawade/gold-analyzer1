import { db } from './db';
import { goldPrices, geopoliticalEvents } from './schema';

export function seedData() {
  const existing = db.select().from(goldPrices).limit(1).all();
  if (existing.length > 0) return;

  console.log('[Seed] Seeding initial data...');
  const basePrice = 3280;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    const price = basePrice + (Math.random() - 0.5) * 60 + (30 - i) * 1.2;
    db.insert(goldPrices)
      .values({
        priceUsd: Number(price.toFixed(2)),
        source: 'seed',
        createdAt: t,
      })
      .run();
  }

  db.insert(geopoliticalEvents)
    .values([
      {
        title: 'System Launch',
        description: 'Gold Psychology Analyzer initialized and started tracking cycles.',
        impactScore: 5,
      },
      {
        title: 'Asian Session Open',
        description: 'Markets opened with moderate risk appetite.',
        impactScore: 2,
      },
    ])
    .run();
}
