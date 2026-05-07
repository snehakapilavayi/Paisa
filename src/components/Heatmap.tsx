import { useMemo } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { fmt, startOfWeek, txInRange, startOfDay } from "@/lib/finance";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ api }: { api: TransactionsApi }) {
  const { data, max, currentWeekLogged } = useMemo(() => {
    // get last 4 weeks of data
    const now = new Date();
    const end = now.getTime();
    const start = end - 28 * 86400000;
    const tx = txInRange(api.tx, start, end);
    
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    tx.forEach(t => {
      const d = new Date(t.ts).getDay();
      const idx = (d + 6) % 7; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
      dayTotals[idx] += t.amount;
    });

    // Check which days in the *current week* have transactions (for stickers)
    const currentWeekLogged = [false, false, false, false, false, false, false];
    const ws = startOfWeek(now).getTime();
    const currentWeekTx = txInRange(api.tx, ws, end);
    currentWeekTx.forEach(t => {
      const d = new Date(t.ts).getDay();
      const idx = (d + 6) % 7;
      currentWeekLogged[idx] = true;
    });

    const max = Math.max(...dayTotals, 1);
    return { data: dayTotals, max, currentWeekLogged };
  }, [api.tx]);

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h3 className="font-display text-2xl tracking-tight mb-6">Spend Heatmap</h3>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => {
          const val = data[i];
          const pct = Math.round((val / max) * 100);
          const hasSticker = currentWeekLogged[i];
          return (
            <div key={d} className="flex flex-col items-center gap-2 group">
              <div className="w-full relative h-24 bg-secondary rounded-xl overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 w-full bg-foreground transition-all duration-700 rounded-xl group-hover:bg-primary"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{d}</span>
              <div className="h-4 flex items-center justify-center">
                {hasSticker && <span className="text-sm drop-shadow-sm" title="Expense logged this week">🌟</span>}
              </div>
              <span className="text-[10px] font-mono-tabular opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-foreground text-background px-2 py-1 rounded">
                {fmt(val)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-center text-muted-foreground">Based on the last 28 days of spending</p>
    </section>
  );
}
