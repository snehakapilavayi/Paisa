export type CategoryId = "food" | "travel" | "shopping" | "random";

export type Category = {
  id: CategoryId;
  label: string;
  emoji: string;
  colorVar: string; // hsl var name
  defaultBenchmark: number; // daily limit
};

export const CATEGORIES: Category[] = [
  { id: "food",     label: "Food",     emoji: "🍜", colorVar: "--cat-food",     defaultBenchmark: 150 },
  { id: "travel",   label: "Travel",   emoji: "🚇", colorVar: "--cat-travel",   defaultBenchmark: 80 },
  { id: "shopping", label: "Shopping", emoji: "🛍️", colorVar: "--cat-shopping", defaultBenchmark: 200 },
  { id: "random",   label: "Random",   emoji: "✨", colorVar: "--cat-random",   defaultBenchmark: 80 },
];

export const CAT_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

export type Transaction = {
  id: string;
  amount: number;
  category: CategoryId;
  note?: string;
  mood?: string;
  ts: number; // epoch ms
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadlineMs: number;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  activeUntilMs: number;
  isCompleted: boolean;
};

export type Benchmarks = Record<CategoryId, number>;

export const DEFAULT_BENCHMARKS: Benchmarks = {
  food: 150, travel: 80, shopping: 200, random: 80,
};

// ── Friends Module Types ──────────────────────────────────────────────────────

export type Person = {
  id: string;
  name: string;
  createdAt: number;     // epoch ms
  lastActivityAt: number; // epoch ms – used for sorting
};

export type Repayment = {
  id: string;
  amount: number;
  date: number;           // epoch ms
  note?: string;
};

export type LendBorrowEntry = {
  id: string;
  personId: string;
  type: "lent" | "borrowed";
  amount: number;          // original amount
  reason?: string;
  note?: string;
  expectedReturnMs?: number;
  createdAt: number;
  repayments: Repayment[];
  settled: boolean;
};

export const QUICK_REASONS = [
  "Lunch", "Dinner", "Books", "Trip", "Cab",
  "Hostel Fee", "Shopping", "Coffee", "Movie", "Groceries",
] as const;
