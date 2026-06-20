import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryId, Benchmarks, Transaction, Goal } from "@/lib/categories";
import { storage, uid } from "@/lib/finance";

export function useTransactions() {
  const [tx, setTx] = useState<Transaction[]>(() => storage.loadTx());
  const [benchmarks, setBenchmarks] = useState<Benchmarks>(() => storage.loadBenchmarks());
  const [startMs] = useState<number>(() => storage.loadStart());
  const [goals, setGoals] = useState<Goal[]>(() => storage.loadGoals());
  const [balance, setBalance] = useState<number>(() => storage.loadBalance());

  useEffect(() => { storage.saveTx(tx); }, [tx]);
  useEffect(() => { storage.saveBenchmarks(benchmarks); }, [benchmarks]);
  useEffect(() => { storage.saveGoals(goals); }, [goals]);
  useEffect(() => { storage.saveBalance(balance); }, [balance]);

  const add = useCallback((amount: number, category: CategoryId, note?: string, mood?: string) => {
    const t: Transaction = { id: uid(), amount, category, note, mood, ts: Date.now() };
    setTx((cur) => [t, ...cur]);
    return t;
  }, []);

  const remove = useCallback((id: string) => {
    setTx((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const recategorize = useCallback((id: string, category: CategoryId) => {
    setTx((cur) => cur.map((t) => (t.id === id ? { ...t, category } : t)));
  }, []);

  const setBenchmark = useCallback((cat: CategoryId, value: number) => {
    setBenchmarks((cur) => ({ ...cur, [cat]: value }));
  }, []);

  const addGoal = useCallback((name: string, target: number, deadlineMs: number) => {
    const g: Goal = { id: uid(), name, target, saved: 0, deadlineMs };
    setGoals((cur) => [...cur, g]);
  }, []);

  const updateGoal = useCallback((id: string, saved: number) => {
    setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, saved } : g)));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((cur) => cur.filter((g) => g.id !== id));
  }, []);

  const addBalance = useCallback((amount: number) => {
    setBalance((cur) => cur + amount);
  }, []);

  return useMemo(() => ({
    tx, benchmarks, startMs, goals, balance,
    add, remove, recategorize, setBenchmark,
    addGoal, updateGoal, removeGoal, addBalance
  }), [tx, benchmarks, startMs, goals, balance, add, remove, recategorize, setBenchmark, addGoal, updateGoal, removeGoal, addBalance]);
}

export type TransactionsApi = ReturnType<typeof useTransactions>;
