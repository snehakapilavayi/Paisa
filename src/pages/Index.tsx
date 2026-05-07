import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { CategoryMirror } from "@/components/CategoryMirror";
import { StreakCard } from "@/components/StreakCard";
import { ScoreCard } from "@/components/ScoreCard";
import { RecentList } from "@/components/RecentList";
import { Recap } from "@/components/Recap";
import { Heatmap } from "@/components/Heatmap";
import { Challenges } from "@/components/Challenges";
import { QuickLog } from "@/components/QuickLog";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Home, BarChart2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "stats" | "activity" | "more";

const tabs: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: "home",     label: "Home",     Icon: Home },
  { id: "stats",    label: "Stats",    Icon: BarChart2 },
  { id: "activity", label: "Activity", Icon: Clock },
  { id: "more",     label: "Explore",  Icon: Sparkles },
];

const Index = () => {
  const api = useTransactions();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const handleTabChange = (id: Tab) => {
    if (id !== activeTab) setActiveTab(id);
  };

  return (
    <div className="app-shell">
      {/* Scrollable content area */}
      <div className="app-screen">

        {/* ── HOME ─────────────────────────────────────────────── */}
        {activeTab === "home" && (
          <div className="screen-enter">
            <header className="app-header">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Paisa</p>
                <h1 className="mt-0.5 font-display text-lg tracking-tight leading-tight">{today}</h1>
              </div>
              <SettingsPanel api={api} />
            </header>

            <div className="px-5 space-y-4 pb-2">
              <CategoryMirror api={api} />
              <div className="grid grid-cols-2 gap-4">
                <StreakCard api={api} />
                <ScoreCard api={api} />
              </div>
              <Challenges api={api} />
            </div>
          </div>
        )}

        {/* ── STATS ────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div className="screen-enter">
            <header className="app-header">
              <h1 className="font-display text-2xl tracking-tight">Stats</h1>
            </header>
            <div className="px-5 space-y-4 pb-2">
              <Recap api={api} />
              <Heatmap api={api} />
            </div>
          </div>
        )}

        {/* ── ACTIVITY ─────────────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="screen-enter">
            <header className="app-header">
              <h1 className="font-display text-2xl tracking-tight">Activity</h1>
            </header>
            <div className="px-5 pb-2">
              <RecentList api={api} />
            </div>
          </div>
        )}

        {/* ── MORE / EXPLORE ───────────────────────────────────── */}
        {activeTab === "more" && (
          <div className="screen-enter">
            <header className="app-header">
              <h1 className="font-display text-2xl tracking-tight">Explore</h1>
            </header>
            <div className="px-5 space-y-4 pb-2">
              {/* Tips card */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">💡 Tips</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span>📝</span> Type a note like "lunch with friends" when logging to remember what the expense was.</li>
                  <li className="flex gap-2"><span>🎯</span> Set a savings goal in the Stats → Goals tab and track your daily target.</li>
                  <li className="flex gap-2"><span>🌟</span> Stickers appear on the heatmap for every day you log at least one expense.</li>
                  <li className="flex gap-2"><span>🔥</span> Your no-spend streak resets the moment you log anything — keep it going!</li>
                  <li className="flex gap-2"><span>🤖</span> Use the "Type to log" field to just type "120 on food" and we'll fill in the rest.</li>
                </ul>
              </div>

              {/* Score legend */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">📊 Score Guide</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-score-good inline-block" /> 80–100</span>
                    <span className="text-muted-foreground">Well under budget ✨</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-score-mid inline-block" /> 50–79</span>
                    <span className="text-muted-foreground">Getting close 👀</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-score-bad inline-block" /> 0–49</span>
                    <span className="text-muted-foreground">Over budget 🚨</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground pb-2">
                Paisa builds awareness, not anxiety. Every rupee tracked is progress.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAVIGATION ──────────────────────────────────── */}
      <nav className="bottom-nav">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn("nav-tab", activeTab === id && "active")}
          >
            <div className="nav-icon-wrap">
              <Icon
                className="h-5 w-5 transition-all duration-200"
                strokeWidth={activeTab === id ? 2.5 : 1.8}
                style={{ color: activeTab === id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              />
            </div>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── FAB (always visible) ───────────────────────────────── */}
      <QuickLog api={api} />
    </div>
  );
};

export default Index;

