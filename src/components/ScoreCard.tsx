import { useMemo } from "react";
import { weeklyScore } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";

export function ScoreCard({ api }: { api: TransactionsApi }) {
  const { score, noSpendDays } = useMemo(
    () => weeklyScore(api.tx, api.benchmarks),
    [api.tx, api.benchmarks]
  );

  const tone =
    score >= 75 ? { label: "Sharp 🌟", color: "hsl(var(--score-good))" } :
    score >= 50 ? { label: "Steady 👀", color: "hsl(var(--score-mid))" } :
                  { label: "Overspent 🚨", color: "hsl(var(--score-bad))" };

  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-soft animate-pop-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Week Score</p>
        <span className="text-[11px] font-semibold" style={{ color: tone.color }}>{tone.label}</span>
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center gap-3 flex-1">
        <div className="relative h-24 w-24">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
            <circle
              cx="50" cy="50" r={r} fill="none"
              stroke={tone.color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 700ms cubic-bezier(.2,.8,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-3xl tabular leading-none">{score}</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground leading-snug">
          {noSpendDays > 0
            ? `+${noSpendDays} no-spend day${noSpendDays === 1 ? "" : "s"} 🔥`
            : "Spend less to score higher"}
        </p>
      </div>
    </div>
  );
}

