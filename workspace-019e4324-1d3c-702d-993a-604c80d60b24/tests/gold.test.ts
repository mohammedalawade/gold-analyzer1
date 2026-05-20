import { describe, it, expect } from 'vitest';
import {
  generateMockPrice,
  calculateFearGreed,
  generateRecommendation,
} from '../server/fetcher';

describe('Gold Algorithms', () => {
  it('generateMockPrice stays in realistic bounds', () => {
    let price = 3300;
    for (let i = 0; i < 100; i++) {
      price = generateMockPrice(price);
      expect(price).toBeGreaterThanOrEqual(2800);
      expect(price).toBeLessThanOrEqual(3800);
    }
  });

  it('calculateFearGreed returns 50 with insufficient data', () => {
    expect(calculateFearGreed([])).toBe(50);
    expect(calculateFearGreed([3300])).toBe(50);
  });

  it('calculateFearGreed increases when price is above average', () => {
    const prices = [3000, 3000, 3000, 3000, 3500];
    expect(calculateFearGreed(prices)).toBeGreaterThan(50);
  });

  it('calculateFearGreed decreases when price is below average', () => {
    const prices = [3500, 3500, 3500, 3500, 3000];
    expect(calculateFearGreed(prices)).toBeLessThan(50);
  });

  it('generateRecommendation returns BUY on extreme fear', () => {
    const rec = generateRecommendation(15, 3200, [3300, 3250, 3200]);
    expect(rec.action).toBe('BUY');
    expect(rec.confidence).toBeGreaterThan(80);
  });

  it('generateRecommendation returns SELL on extreme greed', () => {
    const rec = generateRecommendation(85, 3500, [3300, 3400, 3500]);
    expect(rec.action).toBe('SELL');
  });

  it('generateRecommendation returns HOLD near neutral', () => {
    const rec = generateRecommendation(50, 3300, [3300, 3300, 3300]);
    expect(rec.action).toBe('HOLD');
  });
});

describe('Database Schema Sanity', () => {
  it('schema exports are defined', async () => {
    const schema = await import('../server/schema');
    expect(schema.goldPrices).toBeDefined();
    expect(schema.sentimentData).toBeDefined();
    expect(schema.recommendations).toBeDefined();
    expect(schema.economicIndicators).toBeDefined();
    expect(schema.geopoliticalEvents).toBeDefined();
  });
});
