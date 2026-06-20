import { useCallback, useEffect, useMemo, useState } from "react";
import { Person, LendBorrowEntry, Repayment } from "@/lib/categories";
import {
  friendsStorage,
  createPerson,
  createEntry,
  createRepayment,
  netBalance,
  remainingBalance,
  shouldSettle,
  totalToReceive,
  totalToReturn,
  peopleToReceiveFrom,
  peopleToReturn,
  friendsInsights,
} from "@/lib/friends";

export function useFriends() {
  const [people, setPeople] = useState<Person[]>(() => friendsStorage.loadPeople());
  const [entries, setEntries] = useState<LendBorrowEntry[]>(() => friendsStorage.loadEntries());

  // Persist on every change
  useEffect(() => { friendsStorage.savePeople(people); }, [people]);
  useEffect(() => { friendsStorage.saveEntries(entries); }, [entries]);

  // ── People CRUD ──────────────────────────────────────────────────────────
  const addPerson = useCallback((name: string): Person => {
    // Return existing if name matches (case-insensitive)
    const existing = people.find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) return existing;
    const p = createPerson(name);
    setPeople((cur) => [p, ...cur]);
    return p;
  }, [people]);

  const touchPerson = useCallback((personId: string) => {
    setPeople((cur) =>
      cur.map((p) =>
        p.id === personId ? { ...p, lastActivityAt: Date.now() } : p
      )
    );
  }, []);

  // ── Entry CRUD ───────────────────────────────────────────────────────────
  const addEntry = useCallback(
    (
      personId: string,
      type: "lent" | "borrowed",
      amount: number,
      opts: { reason?: string; note?: string; expectedReturnMs?: number } = {}
    ): LendBorrowEntry => {
      const entry = createEntry(personId, type, amount, opts);
      setEntries((cur) => [entry, ...cur]);
      touchPerson(personId);
      return entry;
    },
    [touchPerson]
  );

  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<Pick<LendBorrowEntry, "reason" | "note" | "expectedReturnMs">>
    ) => {
      setEntries((cur) =>
        cur.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  // ── Repayments ───────────────────────────────────────────────────────────
  const addRepayment = useCallback(
    (entryId: string, amount: number, note?: string) => {
      const repayment: Repayment = createRepayment(amount, note);
      setEntries((cur) =>
        cur.map((e) => {
          if (e.id !== entryId) return e;
          const updated = { ...e, repayments: [...e.repayments, repayment] };
          // Auto-settle when fully repaid
          if (shouldSettle(updated)) updated.settled = true;
          return updated;
        })
      );
      // Touch the person for activity sorting
      const entry = entries.find((e) => e.id === entryId);
      if (entry) touchPerson(entry.personId);
    },
    [entries, touchPerson]
  );

  // ── Derived values (memoised) ────────────────────────────────────────────
  const sortedPeople = useMemo(
    () => [...people].sort((a, b) => b.lastActivityAt - a.lastActivityAt),
    [people]
  );

  const summaryReceive = useMemo(() => totalToReceive(entries), [entries]);
  const summaryReturn = useMemo(() => totalToReturn(entries), [entries]);
  const countReceive = useMemo(() => peopleToReceiveFrom(entries, people), [entries, people]);
  const countReturn = useMemo(() => peopleToReturn(entries), [entries]);

  const insights = useMemo(() => friendsInsights(people, entries), [people, entries]);

  const getNetBalance = useCallback(
    (personId: string) => netBalance(entries, personId),
    [entries]
  );

  const getEntriesFor = useCallback(
    (personId: string) =>
      entries
        .filter((e) => e.personId === personId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );

  const getRemainingBalance = useCallback(
    (entry: LendBorrowEntry) => remainingBalance(entry),
    []
  );

  return useMemo(
    () => ({
      // State
      people,
      entries,
      sortedPeople,
      // Summary
      summaryReceive,
      summaryReturn,
      countReceive,
      countReturn,
      insights,
      // CRUD
      addPerson,
      addEntry,
      updateEntry,
      addRepayment,
      // Getters
      getNetBalance,
      getEntriesFor,
      getRemainingBalance,
    }),
    [
      people, entries, sortedPeople,
      summaryReceive, summaryReturn, countReceive, countReturn, insights,
      addPerson, addEntry, updateEntry, addRepayment,
      getNetBalance, getEntriesFor, getRemainingBalance,
    ]
  );
}

export type FriendsApi = ReturnType<typeof useFriends>;
