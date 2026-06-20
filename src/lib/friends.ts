import { Person, LendBorrowEntry, Repayment } from "./categories";
import { uid } from "./finance";

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEY_PEOPLE = "paisa.people.v1";
const KEY_ENTRIES = "paisa.lend.v1";

// ── Persistence ───────────────────────────────────────────────────────────────
export const friendsStorage = {
  loadPeople(): Person[] {
    try {
      const raw = localStorage.getItem(KEY_PEOPLE);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  savePeople(people: Person[]) {
    localStorage.setItem(KEY_PEOPLE, JSON.stringify(people));
  },
  loadEntries(): LendBorrowEntry[] {
    try {
      const raw = localStorage.getItem(KEY_ENTRIES);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  saveEntries(entries: LendBorrowEntry[]) {
    localStorage.setItem(KEY_ENTRIES, JSON.stringify(entries));
  },
  clearAll() {
    localStorage.removeItem(KEY_PEOPLE);
    localStorage.removeItem(KEY_ENTRIES);
  },
};

// ── Factory helpers ───────────────────────────────────────────────────────────
export function createPerson(name: string): Person {
  const now = Date.now();
  return { id: uid(), name: name.trim(), createdAt: now, lastActivityAt: now };
}

export function createEntry(
  personId: string,
  type: "lent" | "borrowed",
  amount: number,
  opts: { reason?: string; note?: string; expectedReturnMs?: number } = {}
): LendBorrowEntry {
  return {
    id: uid(),
    personId,
    type,
    amount,
    reason: opts.reason,
    note: opts.note,
    expectedReturnMs: opts.expectedReturnMs,
    createdAt: Date.now(),
    repayments: [],
    settled: false,
  };
}

export function createRepayment(amount: number, note?: string): Repayment {
  return { id: uid(), amount, date: Date.now(), note };
}

// ── Pure computation helpers ──────────────────────────────────────────────────

/** Remaining balance for a single entry (original minus repaid). */
export function remainingBalance(entry: LendBorrowEntry): number {
  const paid = entry.repayments.reduce((s, r) => s + r.amount, 0);
  return Math.max(0, entry.amount - paid);
}

/** All active (non-settled) entries for a person. */
export function activeEntriesFor(
  entries: LendBorrowEntry[],
  personId: string
): LendBorrowEntry[] {
  return entries.filter((e) => e.personId === personId && !e.settled);
}

/** Net balance for a person: positive = they owe you, negative = you owe them. */
export function netBalance(entries: LendBorrowEntry[], personId: string): number {
  return entries
    .filter((e) => e.personId === personId && !e.settled)
    .reduce((sum, e) => {
      const rem = remainingBalance(e);
      return e.type === "lent" ? sum + rem : sum - rem;
    }, 0);
}

/** Total amount across all people that others owe you (lent, unsettled). */
export function totalToReceive(entries: LendBorrowEntry[]): number {
  return entries
    .filter((e) => e.type === "lent" && !e.settled)
    .reduce((s, e) => s + remainingBalance(e), 0);
}

/** Total amount you owe across all people (borrowed, unsettled). */
export function totalToReturn(entries: LendBorrowEntry[]): number {
  return entries
    .filter((e) => e.type === "borrowed" && !e.settled)
    .reduce((s, e) => s + remainingBalance(e), 0);
}

/** Count of distinct people you have to receive from. */
export function peopleToReceiveFrom(
  entries: LendBorrowEntry[],
  people: Person[]
): number {
  const ids = new Set(
    entries
      .filter((e) => e.type === "lent" && !e.settled && remainingBalance(e) > 0)
      .map((e) => e.personId)
  );
  return ids.size;
}

/** Count of distinct people you owe. */
export function peopleToReturn(entries: LendBorrowEntry[]): number {
  const ids = new Set(
    entries
      .filter((e) => e.type === "borrowed" && !e.settled && remainingBalance(e) > 0)
      .map((e) => e.personId)
  );
  return ids.size;
}

/** Check if an entry should be auto-settled (remaining == 0). */
export function shouldSettle(entry: LendBorrowEntry): boolean {
  return remainingBalance(entry) <= 0;
}

/** Generate lightweight insight strings. */
export function friendsInsights(
  people: Person[],
  entries: LendBorrowEntry[]
): string[] {
  const insights: string[] = [];
  const now = Date.now();
  const DAY = 86400000;

  const receive = totalToReceive(entries);
  const returnAmt = totalToReturn(entries);

  if (receive > 0)
    insights.push(`You have ₹${fmtAmt(receive)} to receive in total.`);
  if (returnAmt > 0)
    insights.push(`You owe ₹${fmtAmt(returnAmt)} to others.`);

  // Find oldest unpaid lent entry
  const oldestLent = entries
    .filter((e) => e.type === "lent" && !e.settled && remainingBalance(e) > 0)
    .sort((a, b) => a.createdAt - b.createdAt)[0];

  if (oldestLent) {
    const person = people.find((p) => p.id === oldestLent.personId);
    const days = Math.floor((now - oldestLent.createdAt) / DAY);
    if (person && days >= 3) {
      insights.push(
        `${person.name} has owed you ₹${fmtAmt(remainingBalance(oldestLent))} for ${days} day${days === 1 ? "" : "s"}.`
      );
    }
  }

  return insights;
}

function fmtAmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
