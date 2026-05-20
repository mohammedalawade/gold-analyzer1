import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core';

export const goldPrices = sqliteTable('gold_prices', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  priceUsd: real('price_usd').notNull(),
  source: text('source').notNull().default('simulation'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const economicIndicators = sqliteTable('economic_indicators', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  value: real('value').notNull(),
  unit: text('unit'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const geopoliticalEvents = sqliteTable('geopolitical_events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  impactScore: integer('impact_score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sentimentData = sqliteTable('sentiment_data', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  fearGreedIndex: integer('fear_greed_index').notNull(),
  sentimentLabel: text('sentiment_label').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const recommendations = sqliteTable('recommendations', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  confidence: integer('confidence').notNull(),
  reasoning: text('reasoning'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  type: text('type').notNull().default('recommendation_change'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
