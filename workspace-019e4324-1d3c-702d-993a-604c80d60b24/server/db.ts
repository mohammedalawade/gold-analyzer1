import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('./data/gold.db');
sqlite.pragma('journal_mode = WAL');

// Ensure tables exist (idempotent)
sqlite.exec(`
CREATE TABLE IF NOT EXISTS gold_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_usd REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'simulation',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS economic_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS geopolitical_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  impact_score INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS sentiment_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fear_greed_index INTEGER NOT NULL,
  sentiment_label TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  reasoning TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'recommendation_change',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
`);

export const db = drizzle(sqlite, { schema });
