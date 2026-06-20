import { Flame } from "lucide-react";
import { useMemo } from "react";
import { computeStreak } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";

export function StreakCard({ api }: { api: TransactionsApi }) {
  const { current, best } = useMemo(
    () => computeStreak(api.tx, api.startMs),
    [api.tx, api.startMs]
  );

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-soft animate-pop-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Awareness</p>
        <Flame className="h-4 w-4 text-accent" fill="hsl(var(--accent))" />
      </div>

      <div className="flex flex-col items-center gap-3 flex-1">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-6xl tabular leading-none">{current}</span>
          <span className="text-sm text-muted-foreground">{current === 1 ? "day" : "days"}</span>
        </div>
        <p className="text-xs text-center text-muted-foreground leading-snug">
          {current === 0
            ? "Log an expense to start your streak"
            : current >= best && current > 0
            ? "You're consistently aware! 🔥"
            : `Best tracking streak: ${best} days`}
        </p>
      </div>
    </div>
  );
}
