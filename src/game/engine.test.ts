import { describe, expect, it, vi } from 'vitest';
import { adjustDifficulty, completeOrder, generateOrder, initialStats, readStats, validateOrder, type History, type Order } from './engine';
const order: Order = { id: 'test', difficulty: 1, items: [{ ingredientId: 'strawberry', quantity: 2 }] };
const history = (corrections: number[]): History[] => corrections.map(c => ({ order, corrections: c, seconds: 10, ingredientCount: 2, ingredientTypes: 1, completedAt: '2026-09-27' }));
describe('order generation', () => {
  for (let level = 1; level <= 5; level++) it(`keeps level ${level} within its limits and avoids repeat orders`, () => {
    let previous: Order | undefined;
    for (let n = 0; n < 500; n++) {
      const result = generateOrder(level, initialStats().unlocked, previous);
      expect(result.items).toHaveLength(level === 1 ? 1 : level < 4 ? 2 : 3);
      expect(new Set(result.items.map(i => i.ingredientId)).size).toBe(result.items.length);
      for (const item of result.items) { expect(initialStats().unlocked).toContain(item.ingredientId); expect(item.quantity).toBeGreaterThanOrEqual(1); expect(item.quantity).toBeLessThanOrEqual(level < 3 ? 3 : 5); }
      const total = result.items.reduce((s,i) => s+i.quantity,0);
      expect(total).toBeLessThanOrEqual(15);
      if(level === 5) expect(total).toBeGreaterThanOrEqual(10);
      const sig = (o: Order) => o.items.map(i => `${i.ingredientId}:${i.quantity}`).sort().join(',');
      if(previous) expect(sig(result)).not.toBe(sig(previous));
      previous = result;
    }
  });
  it('avoids repeats even when random repeatedly returns the same value', () => {
    const previous = generateOrder(1, ['strawberry'], undefined, () => 0);
    expect(generateOrder(1, ['strawberry'], previous, () => 0).items).not.toEqual(previous.items);
  });
});
describe('validation and rewards', () => {
  it('checks missing, extra, and unrequested ingredients', () => {
    expect(validateOrder(order, {strawberry: 2})).toEqual([]);
    expect(validateOrder(order, {strawberry: 1})[0].difference).toBe(1);
    expect(validateOrder(order, {strawberry: 3})[0].difference).toBe(-1);
    expect(validateOrder(order, {strawberry: 2, cookie: 1})[0].ingredient.id).toBe('cookie');
  });
  it('records corrections, time and rewards; changes level only after five completions', () => {
    let stats = initialStats();
    for(let i=0;i<5;i++) { stats = completeOrder(stats, order, 0, 12); if(i<4) expect(stats.level).toBe(1); }
    expect(stats.level).toBe(2); expect(stats.stars).toBe(15); expect(stats.perfectOrders).toBe(5); expect(stats.averageCompletionTime).toBe(12);
    stats = completeOrder(stats, order, 2, 24);
    expect(stats.totalCorrections).toBe(2); expect(stats.averageCompletionTime).toBe(14);
  });
  it('adjusts gently and respects difficulty bounds', () => {
    expect(adjustDifficulty(2, history([0,0,0,1,0]))).toBe(3);
    expect(adjustDifficulty(3, history([0,1,1,1,0]))).toBe(2);
    expect(adjustDifficulty(3, history([0,0,0,1,1]))).toBe(3);
    expect(adjustDifficulty(5, history([0,0,0,0,0]))).toBe(5);
    expect(adjustDifficulty(1, history([1,1,1,1,1]))).toBe(1);
  });
});
describe('storage recovery', () => {
  it('recovers safely from corrupt or unavailable browser storage', () => {
    for(const value of ['{', '{"version":1}', JSON.stringify({...initialStats(),level:99}), JSON.stringify({...initialStats(),stars:-10})]) {
      vi.stubGlobal('localStorage', {getItem:()=>value}); expect(readStats()).toEqual(initialStats());
    }
    vi.stubGlobal('localStorage', {getItem:()=>{throw new Error('blocked');}}); expect(readStats()).toEqual(initialStats());
    vi.unstubAllGlobals();
  });
  it('preserves valid progress and rejects unknown ingredient IDs', () => {
    vi.stubGlobal('localStorage', {getItem:()=>JSON.stringify({...initialStats(),stars:12,unlocked:['blueberry','bogus']})});
    expect(readStats().stars).toBe(12); expect(readStats().unlocked).toContain('blueberry'); expect(readStats().unlocked).not.toContain('bogus'); vi.unstubAllGlobals();
  });
});
