import { useState } from "react";
import { FriendsApi } from "@/hooks/use-friends";
import { Person } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/finance";
import { AddEntrySheet } from "./AddEntrySheet";
import { PersonDetailSheet } from "./PersonDetailSheet";
import { FriendsFab } from "./FriendsFab";
import { TrendingUp, TrendingDown, Users, Sparkles } from "lucide-react";

interface FriendsDashboardProps {
  api: FriendsApi;
}

export function FriendsDashboard({ api }: FriendsDashboardProps) {
  const [sheetType, setSheetType] = useState<"lent" | "borrowed" | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [search, setSearch] = useState("");

  const filteredPeople = api.sortedPeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // People who have any active entries
  const activePeople = filteredPeople.filter(
    (p) => api.getNetBalance(p.id) !== 0 || api.getEntriesFor(p.id).some((e) => !e.settled)
  );
  const settledPeople = filteredPeople.filter(
    (p) => !activePeople.includes(p) && api.getEntriesFor(p.id).length > 0
  );

  const hasAny = api.sortedPeople.length > 0;

  return (
    <div className="space-y-4 pb-8">

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* To Receive */}
        <div className="rounded-3xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">To Receive</p>
          </div>
          <p className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-400 leading-none">
            {fmt(api.summaryReceive)}
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-500 mt-1">
            {api.countReceive} {api.countReceive === 1 ? "person" : "people"}
          </p>
        </div>

        {/* To Return */}
        <div className="rounded-3xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">To Return</p>
          </div>
          <p className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400 leading-none">
            {fmt(api.summaryReturn)}
          </p>
          <p className="text-xs text-rose-500/70 dark:text-rose-500 mt-1">
            {api.countReturn} {api.countReturn === 1 ? "person" : "people"}
          </p>
        </div>
      </div>

      {/* ── Insights ────────────────────────────────────────────── */}
      {api.insights.length > 0 && (
        <div className="rounded-2xl border bg-secondary/30 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Insights</span>
          </div>
          {api.insights.map((insight, i) => (
            <p key={i} className="text-sm text-foreground/80 leading-snug">{insight}</p>
          ))}
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────── */}
      {hasAny && (
        <div className="relative">
          <input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {!hasAny && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No records yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the <span className="text-[#10b981] font-bold">+</span> button to log who you lent or borrowed from
            </p>
          </div>
        </div>
      )}

      {/* ── Active People List ───────────────────────────────────── */}
      {activePeople.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Active</p>
          {activePeople.map((person) => {
            const net = api.getNetBalance(person.id);
            const isReceive = net > 0;
            return (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className="w-full rounded-2xl border bg-card hover:bg-secondary/30 px-4 py-3.5 transition-all active:scale-[0.98] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center font-bold text-lg",
                    isReceive
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                  )}>
                    {person.name[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base leading-tight">{person.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isReceive ? "Owes you" : "You owe"} · {new Date(person.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-lg font-display font-bold tabular",
                    isReceive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                  )}>
                    {fmt(Math.abs(net))}
                  </p>
                  <p className={cn(
                    "text-xs font-semibold",
                    isReceive ? "text-emerald-500" : "text-rose-400"
                  )}>
                    {isReceive ? "↑ receive" : "↓ return"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Settled People ───────────────────────────────────────── */}
      {settledPeople.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Settled</p>
          {settledPeople.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedPerson(person)}
              className="w-full rounded-2xl border bg-card/50 hover:bg-secondary/30 px-4 py-3 transition-all active:scale-[0.98] flex items-center justify-between gap-2 opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-base">
                  {person.name[0].toUpperCase()}
                </div>
                <p className="font-medium text-sm">{person.name}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 rounded-full px-2.5 py-1">
                ✓ All clear
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <FriendsFab onSelect={(type) => setSheetType(type)} />

      {/* ── Sheets ──────────────────────────────────────────────── */}
      <AddEntrySheet
        api={api}
        open={!!sheetType}
        type={sheetType ?? "lent"}
        onClose={() => setSheetType(null)}
      />
      <PersonDetailSheet
        api={api}
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </div>
  );
}
