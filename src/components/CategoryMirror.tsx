import { useMemo } from "react";
import { CAT_MAP } from "@/lib/categories";
import { fmt, startOfWeek, topCategory, totalsByCategory, txInRange } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";

export function CategoryMirror({ api }: { api: TransactionsApi }) {
  const { tx } = api;
  const { top, total, share, weekTx } = useMemo(() => {
    const ws = startOfWeek(new Date()).getTime();
    const week = txInRange(tx, ws, ws + 7 * 86400000);
    const t = topCategory(week);
    const total = week.reduce((s, x) => s + x.amount, 0);
    const share = t && total > 0 ? Math.round((t.amount / total) * 100) : 0;
    return { top: t, total, share, weekTx: week };
  }, [tx]);

  const totals = totalsByCategory(weekTx);

  if (!top) {
    return (
      <section className="rounded-3xl bg-card shadow-soft border p-7 sm:p-9 animate-pop-in">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This week's leak</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight">
          No leaks spotted yet.
        </h2>
        <p className="mt-2 text-muted-foreground">Tap + to log your first expense and see your biggest spending category here.</p>
      </section>
    );
  }

  const cat = CAT_MAP[top.id];
  return (
    <section className="rounded-3xl bg-card shadow-soft border overflow-hidden animate-pop-in">
      <div className="p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This week's leak</p>
          <span className="font-mono-tabular text-xs text-muted-foreground">{fmt(total)} total</span>
        </div>

        <div className="mt-5 flex items-end gap-5">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-3xl shrink-0"
            style={{ backgroundColor: `hsl(var(${cat.colorVar}) / 0.16)` }}
          >
            {cat.emoji}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
              {cat.label}
            </h2>
            <p className="mt-1 text-muted-foreground">
              <span className="font-mono-tabular text-foreground">{fmt(top.amount)}</span> spent · {share}% of this week
            </p>
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2.5 w-full">
        {(["food","travel","shopping","random"] as const).map((id) => {
          const w = total > 0 ? (totals[id] / total) * 100 : 0;
          if (w === 0) return null;
          return <div key={id} style={{ width: `${w}%`, backgroundColor: `hsl(var(${CAT_MAP[id].colorVar}))` }} />;
        })}
      </div>
    </section>
  );
}
