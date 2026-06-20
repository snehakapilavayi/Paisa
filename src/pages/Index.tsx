import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useFriends } from "@/hooks/use-friends";
import { StreakCard } from "@/components/StreakCard";
import { RecentList } from "@/components/RecentList";
import { StoryCard } from "@/components/StoryCard";
import { QuickLog } from "@/components/QuickLog";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Analytics } from "@/components/Analytics";
import { Budgets } from "@/components/Budgets";
import { BalanceCard } from "@/components/BalanceCard";
import { FriendsDashboard } from "@/components/friends/FriendsDashboard";
import { Home, PieChart, Target, Users } from "lucide-react";

type Tab = "home" | "analytics" | "budgets" | "friends";

const Index = () => {
  const api = useTransactions();
  const friendsApi = useFriends();
  const [tab, setTab] = useState<Tab>("home");
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const friendsBadge = friendsApi.summaryReceive + friendsApi.summaryReturn > 0;

  return (
    <div className="app-shell pb-24">
      {/* Scrollable content area */}
      <div className="app-screen">
        <div className="screen-enter" key={tab}>
          <header className="app-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Paisa</p>
              <h1 className="mt-0.5 font-display text-lg tracking-tight leading-tight">
                {tab === "friends" ? "Friends" : today}
              </h1>
            </div>
            <SettingsPanel api={api} />
          </header>

          <div className="px-5 space-y-4 pb-12">
            {tab === "home" && (
              <>
                <BalanceCard api={api} />
                <StoryCard api={api} />
                <StreakCard api={api} />
                <div className="pt-4">
                  <h2 className="font-display text-xl tracking-tight mb-4">Recent</h2>
                  <RecentList api={api} />
                </div>
              </>
            )}
            {tab === "analytics" && <Analytics api={api} />}
            {tab === "budgets" && <Budgets api={api} />}
            {tab === "friends" && <FriendsDashboard api={friendsApi} />}
          </div>
        </div>
      </div>

      {/* ── FAB — hide on Friends tab (it has its own FAB) ──── */}
      {tab !== "friends" && <QuickLog api={api} />}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-tab ${tab === "home" ? "active" : ""}`}
          onClick={() => setTab("home")}
        >
          <div className="nav-icon-wrap"><Home className="w-5 h-5" /></div>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`nav-tab ${tab === "analytics" ? "active" : ""}`}
          onClick={() => setTab("analytics")}
        >
          <div className="nav-icon-wrap"><PieChart className="w-5 h-5" /></div>
          <span className="nav-label">Insights</span>
        </button>
        <button
          className={`nav-tab ${tab === "budgets" ? "active" : ""}`}
          onClick={() => setTab("budgets")}
        >
          <div className="nav-icon-wrap"><Target className="w-5 h-5" /></div>
          <span className="nav-label">Goals</span>
        </button>
        <button
          className={`nav-tab ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
        >
          <div className="nav-icon-wrap relative">
            <Users className="w-5 h-5" />
            {friendsBadge && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#10b981] border-2 border-background" />
            )}
          </div>
          <span className="nav-label">Friends</span>
        </button>
      </nav>
    </div>
  );
};

export default Index;
