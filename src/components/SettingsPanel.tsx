import { useEffect, useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES, CategoryId } from "@/lib/categories";
import { fmt, runwayDays, storage } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";

const KEY_BAL = "paisa.balance.v1";

export function SettingsPanel({ api }: { api: TransactionsApi }) {
  const [balance, setBalance] = useState<number>(() => {
    const raw = localStorage.getItem(KEY_BAL); return raw ? Number(raw) : 0;
  });
  useEffect(() => { localStorage.setItem(KEY_BAL, String(balance)); }, [balance]);

  const days = runwayDays(balance, api.tx);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-full border bg-card p-2.5 hover:bg-secondary transition-colors" aria-label="Settings">
          <Settings2 className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-tight">Tune Paisa</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Runway */}
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Runway mode</p>
            <p className="mt-1 text-sm text-muted-foreground">Set your current balance. We'll calculate how long it lasts at your recent pace.</p>
            <label className="mt-3 flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
              <span className="text-muted-foreground">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={balance || ""}
                onChange={(e) => setBalance(Number(e.target.value) || 0)}
                placeholder="Balance"
                className="w-full bg-transparent text-lg outline-none tabular"
              />
            </label>
            {balance > 0 && (
              <p className="mt-3 text-sm">
                {days === null
                  ? "Log a few expenses to estimate runway."
                  : days >= 60
                  ? <>Your balance lasts <span className="font-display text-xl">{days}+</span> days at this pace.</>
                  : <>Your balance lasts about <span className="font-display text-xl">{days}</span> day{days === 1 ? "" : "s"}. {fmt(balance)}.</>}
              </p>
            )}
          </div>

          {/* Benchmarks */}
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily limits</p>
            <p className="mt-1 text-sm text-muted-foreground">Per-category daily spending targets. Used by Score and Insight.</p>
            <div className="mt-4 space-y-3">
              {CATEGORIES.map((c) => (
                <BenchmarkRow key={c.id} cat={c.id} api={api} />
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive/80 mb-1">Danger zone</p>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete all your transactions, goals, and settings. This cannot be undone.</p>
            <button
              onClick={() => {
                if (window.confirm("Delete everything? This cannot be undone.")) {
                  storage.clearAll();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Clear all data
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-2">
            All data lives on this device only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BenchmarkRow({ cat, api }: { cat: CategoryId; api: TransactionsApi }) {
  const meta = CATEGORIES.find((x) => x.id === cat)!;
  const value = api.benchmarks[cat];
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl text-lg" style={{ backgroundColor: `hsl(var(${meta.colorVar}) / 0.15)` }}>
        {meta.emoji}
      </span>
      <span className="flex-1 font-medium">{meta.label}</span>
      <label className="flex items-center gap-1 rounded-lg border bg-background px-2 py-1.5">
        <span className="text-xs text-muted-foreground">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => api.setBenchmark(cat, Math.max(0, Number(e.target.value) || 0))}
          className="w-16 bg-transparent text-sm outline-none tabular"
        />
        <span className="text-xs text-muted-foreground">/day</span>
      </label>
    </div>
  );
}
