import { Transaction, CategoryId, Benchmarks, DEFAULT_BENCHMARKS } from "./categories";

const KEY_TX = "paisa.tx.v1";
const KEY_BM = "paisa.benchmarks.v1";
const KEY_START = "paisa.startDate.v1";
const KEY_GOALS = "paisa.goals.v1";

export const storage = {
  loadTx(): Transaction[] {
    try {
      const raw = localStorage.getItem(KEY_TX);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  saveTx(tx: Transaction[]) {
    localStorage.setItem(KEY_TX, JSON.stringify(tx));
  },
  loadBenchmarks(): Benchmarks {
    try {
      const raw = localStorage.getItem(KEY_BM);
      return raw ? { ...DEFAULT_BENCHMARKS, ...JSON.parse(raw) } : DEFAULT_BENCHMARKS;
    } catch { return DEFAULT_BENCHMARKS; }
  },
  saveBenchmarks(b: Benchmarks) {
    localStorage.setItem(KEY_BM, JSON.stringify(b));
  },
  loadStart(): number {
    const raw = localStorage.getItem(KEY_START);
    if (raw) return Number(raw);
    const now = Date.now();
    localStorage.setItem(KEY_START, String(now));
    return now;
  },
  loadGoals(): any[] {
    try {
      const raw = localStorage.getItem(KEY_GOALS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  saveGoals(goals: any[]) {
    localStorage.setItem(KEY_GOALS, JSON.stringify(goals));
  },
  loadBalance(): number {
    try {
      const raw = localStorage.getItem("paisa.balance.v1");
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  },
  saveBalance(b: number) {
    localStorage.setItem("paisa.balance.v1", String(b));
  },
  clearAll() {
    [KEY_TX, KEY_BM, KEY_START, KEY_GOALS, "paisa.balance.v1", "paisa.people.v1", "paisa.lend.v1"].forEach((k) => localStorage.removeItem(k));
  },
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---- Date helpers ----
export const startOfDay = (d: Date | number) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
};
export const isSameDay = (a: number, b: number) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export const startOfWeek = (d: Date | number) => {
  // Monday-start week
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
};

export const startOfMonth = (d: Date | number) => {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
};

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

// ---- Aggregations ----
export function txInRange(tx: Transaction[], from: number, to: number) {
  return tx.filter((t) => t.ts >= from && t.ts < to);
}

export function totalsByCategory(tx: Transaction[]): Record<CategoryId, number> {
  const r: Record<CategoryId, number> = { food: 0, travel: 0, shopping: 0, random: 0 };
  tx.forEach((t) => { r[t.category] += t.amount; });
  return r;
}

export function topCategory(tx: Transaction[]): { id: CategoryId; amount: number } | null {
  const totals = totalsByCategory(tx);
  let best: CategoryId | null = null; let max = 0;
  (Object.keys(totals) as CategoryId[]).forEach((k) => {
    if (totals[k] > max) { max = totals[k]; best = k; }
  });
  return best ? { id: best, amount: max } : null;
}

// ---- Awareness streak ----
export function computeStreak(tx: Transaction[], startMs: number, today = new Date()): {
  current: number; best: number; trackedDays: number[];
} {
  const todayStart = startOfDay(today).getTime();
  const startDay = startOfDay(startMs).getTime();

  const spent = new Set<number>();
  tx.forEach((t) => spent.add(startOfDay(t.ts).getTime()));

  // Current streak (walk back from today)
  let current = 0;
  let cursor = todayStart;
  if (spent.has(todayStart)) { current++; cursor -= 86400000; }
  else { cursor -= 86400000; }
  while (cursor >= startDay) {
    if (spent.has(cursor)) current++;
    else break;
    cursor -= 86400000;
  }

  // Best streak ever
  let best = 0; let run = 0;
  for (let d = startDay; d <= todayStart; d += 86400000) {
    if (spent.has(d)) { run++; if (run > best) best = run; }
    else run = 0;
  }

  // Last 14 days for heatmap dots
  const trackedDays: number[] = [];
  for (let i = 13; i >= 0; i--) {
    trackedDays.push(spent.has(todayStart - i * 86400000) ? 1 : 0);
  }

  return { current, best, trackedDays };
}

// ---- Insight sentence ----
export function insightSentence(tx: Transaction[]): string {
  const ws = startOfWeek(new Date());
  const week = txInRange(tx, ws.getTime(), ws.getTime() + 7 * 86400000);
  if (week.length === 0) return "Clean slate this week. Tap + to log your first expense.";
  const totals = totalsByCategory(week);
  const top = topCategory(week);
  const total = week.reduce((s, t) => s + t.amount, 0);
  if (!top) return "Quiet week so far. Keep it up!";
  const pct = Math.round((totals[top.id] / total) * 100);
  const catLabel = top.id.charAt(0).toUpperCase() + top.id.slice(1);
  return `${catLabel} took ${pct}% of your spending this week — ${fmt(totals[top.id])} of ${fmt(total)} total.`;
}

// ---- NLP ----
export function parseNaturalLanguage(input: string): { amount: number | null; category: CategoryId | null; note: string } {
  const amountMatch = input.match(/(\d+(\.\d+)?)/);
  const amount = amountMatch ? Number(amountMatch[1]) : null;

  let category: CategoryId | null = null;
  const lower = input.toLowerCase();
  if (lower.match(/\b(lunch|dinner|breakfast|food|coffee|snack|eat|restaurant|swiggy|zomato|chai)\b/)) category = "food";
  else if (lower.match(/\b(uber|ola|rapido|bus|train|metro|flight|cab|travel|petrol|gas)\b/)) category = "travel";
  else if (lower.match(/\b(shoes|clothes|amazon|flipkart|myntra|shopping|buy|bought|shirt|pant|dress)\b/)) category = "shopping";
  else if (lower.match(/\b(random|movie|ticket|game|party|club)\b/)) category = "random";

  return { amount, category, note: input };
}

// ---- Runway & Forecasting ----
export function runwayDays(balance: number, tx: Transaction[]): number | null {
  if (balance <= 0) return 0;
  const now = Date.now();
  const cutoff = now - 14 * 86400000;
  const recent = tx.filter((t) => t.ts >= cutoff);
  if (recent.length === 0) return null;
  const total = recent.reduce((s, t) => s + t.amount, 0);
  const perDay = total / 14;
  if (perDay <= 0) return null;
  return Math.floor(balance / perDay);
}

// ---- Formatting ----
export function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}

// ---- Spike detection ----
// A transaction is a spike if it's > 2.5x the median amount for that category over last 30 days.
export function spikes(tx: Transaction[]): Transaction[] {
  const now = Date.now();
  const cutoff = now - 30 * 86400000;
  const recent = tx.filter((t) => t.ts >= cutoff);
  const out: Transaction[] = [];
  (["food","travel","shopping","random"] as CategoryId[]).forEach((cat) => {
    const items = recent.filter((t) => t.category === cat).map((t) => t.amount).sort((a,b) => a - b);
    if (items.length < 4) return;
    const median = items[Math.floor(items.length / 2)];
    const threshold = Math.max(median * 2.5, median + 20);
    recent.filter((t) => t.category === cat && t.amount >= threshold).forEach((t) => out.push(t));
  });
  return out.sort((a,b) => b.ts - a.ts);
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
