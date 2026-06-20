import { Transaction, CategoryId, Benchmarks, DEFAULT_BENCHMARKS } from "./categories";

const KEY_TX = "paisa.tx.v1";
const KEY_BM = "paisa.benchmarks.v1";
const KEY_START = "paisa.startDate.v1";
const KEY_GOALS = "paisa.goals.v1";

export const storage = {
  loadTx(): Transaction[] {
    try {
      const raw = localStorage.getItem(KEY_TX);
      if (raw) {
        const parsed = JSON.parse(raw) as Transaction[];
        if (parsed.length > 0) return parsed;
      }
      const mock = getMockTransactions();
      localStorage.setItem(KEY_TX, JSON.stringify(mock));
      return mock;
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
    const txRaw = localStorage.getItem(KEY_TX);
    let now = Date.now();
    if (txRaw) {
      try {
        if ((JSON.parse(txRaw)).length > 20) {
          now = Date.now() - 45 * 86400000;
        }
      } catch {}
    }
    localStorage.setItem(KEY_START, String(now));
    return now;
  },
  loadGoals(): any[] {
    try {
      const raw = localStorage.getItem(KEY_GOALS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) return parsed;
      }
      const mock = [
        { id: uid(), name: "MacBook Pro", target: 120000, saved: 45000, deadlineMs: Date.now() + 90 * 86400000 },
        { id: uid(), name: "Goa Trip", target: 25000, saved: 12000, deadlineMs: Date.now() + 30 * 86400000 },
      ];
      localStorage.setItem(KEY_GOALS, JSON.stringify(mock));
      return mock;
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
    [KEY_TX, KEY_BM, KEY_START, KEY_GOALS, "paisa.balance.v1"].forEach((k) => localStorage.removeItem(k));
  },
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---- Date helpers ----
export const startOfDay = (d: Date | number) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
};
export const isSameDay = (a: number, b: number) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export const startOfWeek = (d: Date | number) => {
  // Monday-start week
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
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
  current: number; best: number;
} {
  const todayStart = startOfDay(today).getTime();
  const startDay = startOfDay(startMs).getTime();
  // Build set of days that had spending
  const spent = new Set<number>();
  tx.forEach((t) => spent.add(startOfDay(t.ts).getTime()));

  // Walk backwards from yesterday (today counts if tracked, otherwise assume they might track later)
  let current = 0;
  let cursor = todayStart;
  
  // If they tracked today, include today. If not, start counting from yesterday.
  if (spent.has(todayStart)) {
    current++;
    cursor -= 86400000;
  } else {
    cursor -= 86400000;
  }

  while (cursor >= startDay) {
    if (spent.has(cursor)) current++;
    else break;
    cursor -= 86400000;
  }

  // Best tracking streak
  let best = 0; let run = 0;
  for (let d = startDay; d <= todayStart; d += 86400000) {
    if (spent.has(d)) { run++; if (run > best) best = run; }
    else run = 0;
  }
  return { current, best };
}

// ---- Weekly score (0-100) ----
// Lower spending vs benchmarks = higher score. No-spend days bonus.
export function weeklyScore(tx: Transaction[], benchmarks: Benchmarks, weekStart: Date = startOfWeek(new Date())): {
  score: number;
  breakdown: Record<CategoryId, { spent: number; budget: number; pct: number }>;
  noSpendDays: number;
} {
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekStartMs + 7 * 86400000;
  const weekTx = txInRange(tx, weekStartMs, weekEndMs);
  const totals = totalsByCategory(weekTx);

  const breakdown = {} as Record<CategoryId, { spent: number; budget: number; pct: number }>;
  let totalRatio = 0;
  (Object.keys(benchmarks) as CategoryId[]).forEach((k) => {
    const budget = benchmarks[k] * 7;
    const spent = totals[k];
    const pct = budget === 0 ? (spent > 0 ? 1.5 : 0) : spent / budget;
    breakdown[k] = { spent, budget, pct };
    totalRatio += Math.min(pct, 1.5);
  });
  const avgRatio = totalRatio / 4; // 0..1.5

  // Base: 100 when at 0 spend, 60 when at budget, 0 when 1.5x+
  let base = 100 - avgRatio * 60; // 100..10
  base = Math.max(0, Math.min(100, base));

  // Bonus: no-spend days this week
  const today = startOfDay(new Date()).getTime();
  const daysElapsed = Math.min(7, Math.floor((today - weekStartMs) / 86400000) + 1);
  const spentDays = new Set<number>();
  weekTx.forEach((t) => spentDays.add(startOfDay(t.ts).getTime()));
  let noSpendDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const d = weekStartMs + i * 86400000;
    if (!spentDays.has(d)) noSpendDays++;
  }
  const bonus = Math.min(15, noSpendDays * 3);
  return { score: Math.round(Math.max(0, Math.min(100, base + bonus))), breakdown, noSpendDays };
}

// ---- Insight sentence ----
export function insightSentence(tx: Transaction[], benchmarks: Benchmarks): string {
  const ws = startOfWeek(new Date());
  const week = txInRange(tx, ws.getTime(), ws.getTime() + 7 * 86400000);
  if (week.length === 0) return "Clean slate this week. Tap + to log your first expense.";
  const totals = totalsByCategory(week);
  const top = topCategory(week);
  const total = week.reduce((s, t) => s + t.amount, 0);
  if (!top) return "Quiet week so far. Keep it up!";
  const pct = Math.round((totals[top.id] / total) * 100);

  // Compare top category to its weekly budget
  const budget = benchmarks[top.id] * 7;
  const overBy = totals[top.id] - budget;
  const cat = top.id;
  if (overBy > 0 && budget > 0) {
    return `${pct}% of your week went to ${cap(cat)} — ${fmt(overBy)} over your limit. Time to watch it.`;
  }
  if (budget > 0 && totals[top.id] / budget < 0.5) {
    return `${cap(cat)} led your spending at ${pct}%, but you're still comfortably under your weekly limit. Nice.`;
  }
  return `${cap(cat)} took ${pct}% of your spending this week — ${fmt(totals[top.id])} of ${fmt(total)} total.`;
}

// ---- Spike detection ----
// A transaction is a spike if it's > 2x the median amount for that category over last 30 days.
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
  const total = recent.reduce((s,t) => s + t.amount, 0);
  const perDay = total / 14;
  if (perDay <= 0) return null;
  return Math.floor(balance / perDay);
}

// ---- Formatting ----
export function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---- Mock Data ----
function getMockTransactions(): Transaction[] {
  const tx: Transaction[] = [];
  const now = Date.now();
  const DAY = 86400000;
  
  const items = [
    { cat: "food", note: "Lunch at cafe", amt: [120, 150, 200, 250], mood: "🍜" },
    { cat: "food", note: "Dinner order", amt: [300, 450, 500, 280], mood: "🍕" },
    { cat: "food", note: "Coffee", amt: [80, 100, 150], mood: "☕" },
    { cat: "travel", note: "Uber to work", amt: [180, 220, 250], mood: "🚗" },
    { cat: "travel", note: "Metro card recharge", amt: [500], mood: "🚇" },
    { cat: "shopping", note: "Amazon", amt: [450, 890, 1200], mood: "📦" },
    { cat: "shopping", note: "Myntra clothes", amt: [1500, 2200], mood: "👕" },
    { cat: "shopping", note: "Groceries", amt: [600, 800, 1000], mood: "🛒" },
    { cat: "random", note: "Movie tickets", amt: [350, 400], mood: "🎟️" },
    { cat: "random", note: "Spotify subscription", amt: [119], mood: "🎵" },
    { cat: "food", note: "Swiggy snack", amt: [150, 180], mood: "🍔" },
    { cat: "travel", note: "Rapido ride", amt: [60, 90, 110], mood: "🛵" },
  ];

  for (let i = 0; i < 45; i++) { // span 45 days
    const tsBase = now - i * DAY;
    // skip a few days to make it look realistic (broken streaks)
    if (i === 5 || i === 12 || i === 25 || i === 30) continue; 
    
    const numTx = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTx; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const amount = item.amt[Math.floor(Math.random() * item.amt.length)];
      const ts = tsBase - Math.floor(Math.random() * (DAY / 2));
      tx.push({
        id: uid(),
        amount,
        category: item.cat as CategoryId,
        note: item.note,
        mood: item.mood,
        ts
      });
    }
  }

  // Ensure there's a transaction for today for "present"
  tx.push({
    id: uid(),
    amount: 150,
    category: "food",
    note: "Morning Coffee",
    mood: "☕",
    ts: now - 3600000 // 1 hour ago
  });

  return tx.sort((a, b) => b.ts - a.ts);
}
