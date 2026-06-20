import { Flame } from "lucide-react";
import { useMemo } from "react";
import { computeStreak } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";

export function StreakCard({ api }: { api: TransactionsApi }) {
  const { current, best, trackedDays } = useMemo(
    () => computeStreak(api.tx, api.startMs),
    [api.tx, api.startMs]
  );

  const levelInfo = useMemo(() => {
    if (current === 0) {
      return {
        level: "Lvl 0: Dormant ❄️",
        desc: "No logs yet. Did you spend 0 rupees today? Teach us your ways! 🤯",
        flameColor: "text-muted-foreground/30",
        flameGlow: "",
      };
    }
    if (current <= 3) {
      return {
        level: "Lvl 1: Spark 🕯️",
        desc: "First ember lit. Keep the habit burning!",
        flameColor: "text-amber-500 fill-amber-500/20",
        flameGlow: "shadow-amber-500/20",
      };
    }
    if (current <= 7) {
      return {
        level: "Lvl 2: Ember 🔥",
        desc: "Steady flame! Your wallet is watching. 👁️",
        flameColor: "text-orange-500 fill-orange-500/30",
        flameGlow: "shadow-orange-500/30",
      };
    }
    if (current <= 14) {
      return {
        level: "Lvl 3: Blaze ⚡",
        desc: "Absolute blaze! Track star status! ⚡",
        flameColor: "text-accent fill-accent/40",
        flameGlow: "shadow-accent/40",
      };
    }
    return {
      level: "Lvl 4: Supernova 👑",
      desc: "Wildfire! You've achieved tracker god status! 👑",
      flameColor: "text-accent fill-accent animate-pulse",
      flameGlow: "shadow-accent/60 ring-4 ring-accent/20",
    };
  }, [current]);

  // Convert trackedDays list (last 14 days) into display labels
  const heatmapDots = useMemo(() => {
    const today = new Date();
    return trackedDays.map((val, i) => {
      const daysAgo = 13 - i;
      const targetDate = new Date(today.getTime() - daysAgo * 86400000);
      const weekdayLetter = targetDate.toLocaleDateString("en-US", { weekday: "narrow" });
      return {
        active: val === 1,
        letter: weekdayLetter,
        label: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
      };
    });
  }, [trackedDays]);

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft animate-pop-in flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Awareness Streak</p>
          <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border">
            {levelInfo.level}
          </span>
        </div>

        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-300",
          levelInfo.flameGlow
        )}>
          <Flame className={cn("h-5 w-5 transition-transform", levelInfo.flameColor)} />
        </div>
      </div>

      {/* Main Number */}
      <div className="flex flex-col items-center py-2">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-6xl tabular-nums leading-none tracking-tight">{current}</span>
          <span className="text-sm font-semibold text-muted-foreground">{current === 1 ? "day" : "days"}</span>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-3 max-w-[280px] leading-relaxed">
          {levelInfo.desc}
        </p>
      </div>

      {/* 14-Day Heatmap */}
      <div className="pt-2 border-t border-dashed">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">14-Day Tracking Heatmap</span>
          <span className="text-[10px] text-muted-foreground">Best: {best}d</span>
        </div>
        <div className="flex justify-between items-center gap-1 bg-secondary/20 p-3 rounded-2xl border">
          {heatmapDots.map((dot, idx) => (
            <div
              key={idx}
              title={dot.label}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <span className="text-[8px] font-bold text-muted-foreground/60 select-none">
                {dot.letter}
              </span>
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  dot.active
                    ? "bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.6)] scale-110"
                    : "bg-muted-foreground/15"
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground/75 px-1 mt-2">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
