export const ingredients = [
  { id: 'strawberry', name: 'いちご', emoji: '🍓', color: 'pink', cost: 0 },
  { id: 'chocolate', name: 'チョコ', emoji: '🍫', color: 'brown', cost: 0 },
  { id: 'cookie', name: 'クッキー', emoji: '🍪', color: 'yellow', cost: 0 },
  { id: 'cherry', name: 'さくらんぼ', emoji: '🍒', color: 'red', cost: 0 },
  { id: 'blueberry', name: 'ブルーベリー', emoji: '🫐', color: 'purple', cost: 10 },
  { id: 'star', name: 'おほしさま', emoji: '⭐', color: 'yellow', cost: 15 },
] as const;
export type IngredientId = typeof ingredients[number]['id'];
export type Counts = Partial<Record<IngredientId, number>>;
export type Order = { id: string; difficulty: number; items: { ingredientId: IngredientId; quantity: number }[] };
export type History = { order: Order; corrections: number; seconds: number; ingredientCount: number; ingredientTypes: number; completedAt: string };
export type Stats = { version: 1; level: number; stars: number; cakesCompleted: number; perfectOrders: number; totalCorrections: number; averageCompletionTime: number; playCount: number; unlocked: IngredientId[]; history: History[]; sound: boolean };
export const initialStats = (): Stats => ({ version: 1, level: 1, stars: 0, cakesCompleted: 0, perfectOrders: 0, totalCorrections: 0, averageCompletionTime: 0, playCount: 0, unlocked: ingredients.filter(i => !i.cost).map(i => i.id), history: [], sound: false });
export const STORAGE_KEY = 'wakuwaku-cake-shop-v1';
const signature = (order: Order) => order.items.map(i => `${i.ingredientId}:${i.quantity}`).sort().join(',');
export function generateOrder(level: number, unlocked: IngredientId[], previous?: Order, random = Math.random): Order {
  const difficulty = Math.max(1, Math.min(5, Math.floor(level)));
  const pool = [...new Set(unlocked)].filter(id => ingredients.some(i => i.id === id));
  if (!pool.length) pool.push('strawberry');
  const count = Math.min(pool.length, difficulty === 1 ? 1 : difficulty < 4 ? 2 : 3);
  const max = difficulty < 3 ? 3 : 5;
  let result: Order;
  let attempt = 0;
  do {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const items = shuffled.slice(0, count).map(ingredientId => ({ ingredientId, quantity: 1 + Math.floor(random() * max) }));
    if (difficulty === 5) {
      let total = items.reduce((s, i) => s + i.quantity, 0);
      while (total < Math.min(10, count * max)) { for (const item of items) { if (item.quantity < max && total < 10) { item.quantity++; total++; } } }
    }
    result = { id: crypto.randomUUID(), difficulty, items };
  } while (previous && signature(result) === signature(previous) && ++attempt < 20);
  if (previous && signature(result) === signature(previous)) {
    const item = result.items[0];
    if (difficulty === 5) {
      const total = result.items.reduce((s, i) => s + i.quantity, 0);
      const adjustable = result.items.find(i => total > 10 ? i.quantity > 1 : i.quantity < 5);
      if (adjustable) adjustable.quantity += total > 10 ? -1 : 1;
      else item.quantity = item.quantity === max ? max - 1 : item.quantity + 1;
    } else item.quantity = item.quantity === max ? 1 : item.quantity + 1;
  }
  return result;
}
export function validateOrder(order: Order, counts: Counts) {
  return ingredients.flatMap(ingredient => {
    const wanted = order.items.find(i => i.ingredientId === ingredient.id)?.quantity ?? 0;
    const actual = counts[ingredient.id] ?? 0;
    return wanted === actual ? [] : [{ ingredient, wanted, actual, difference: wanted - actual }];
  });
}
export function adjustDifficulty(level: number, history: History[]) {
  if (history.length < 5) return level;
  const perfect = history.slice(-5).filter(h => h.corrections === 0).length;
  return Math.max(1, Math.min(5, level + (perfect >= 4 ? 1 : perfect <= 2 ? -1 : 0)));
}
export function completeOrder(stats: Stats, order: Order, corrections: number, seconds: number): Stats {
  const entry: History = { order, corrections, seconds, ingredientCount: order.items.reduce((s, i) => s + i.quantity, 0), ingredientTypes: order.items.length, completedAt: new Date().toISOString() };
  const history = [...stats.history, entry].slice(-100);
  const cakesCompleted = stats.cakesCompleted + 1;
  return { ...stats, history, cakesCompleted, stars: stats.stars + 3, perfectOrders: stats.perfectOrders + Number(corrections === 0), totalCorrections: stats.totalCorrections + corrections, averageCompletionTime: (stats.averageCompletionTime * stats.cakesCompleted + seconds) / cakesCompleted, level: cakesCompleted % 5 === 0 ? adjustDifficulty(stats.level, history) : stats.level };
}
export function readStats(): Stats {
  const defaults = initialStats();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || data.version !== 1) return defaults;
    for (const key of ['stars', 'cakesCompleted', 'perfectOrders', 'totalCorrections', 'averageCompletionTime', 'playCount']) if (!Number.isFinite(data[key]) || data[key] < 0) return defaults;
    if (!Number.isInteger(data.level) || data.level < 1 || data.level > 5 || !Array.isArray(data.unlocked) || !Array.isArray(data.history)) return defaults;
    const history = data.history.filter((h: History) => h && Number.isFinite(h.corrections) && h.corrections >= 0 && Number.isFinite(h.seconds) && h.seconds >= 0 && h.order && Array.isArray(h.order.items)).slice(-100);
    return { ...defaults, ...data, history, sound: data.sound === true, unlocked: [...new Set([...defaults.unlocked, ...data.unlocked.filter((id: IngredientId) => ingredients.some(i => i.id === id))])] };
  } catch { return defaults; }
}
