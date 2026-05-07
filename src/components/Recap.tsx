import { useMemo } from "react";
import { CAT_MAP, CategoryId } from "@/lib/categories";
import { fmt, startOfMonth, startOfWeek, totalsByCategory, txInRange, runwayDays } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Recap({ api }: { api: TransactionsApi }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft relative overflow-hidden">
      <h3 className="font-display text-2xl tracking-tight">Recap</h3>
      <Tabs defaultValue="week" className="mt-4">
        <TabsList className="bg-secondary relative z-10 w-full flex">
          <TabsTrigger value="week" className="flex-1">This week</TabsTrigger>
          <TabsTrigger value="month" className="flex-1">This month</TabsTrigger>
          <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="mt-5 relative z-10">
          <Block label="week" range={weekRange()} prevRange={prevWeekRange()} api={api} />
        </TabsContent>
        <TabsContent value="month" className="mt-5 relative z-10">
          <Block label="month" range={monthRange()} prevRange={prevMonthRange()} api={api} isMonth />
        </TabsContent>
        <TabsContent value="goals" className="mt-5 relative z-10">
          <GoalsBlock api={api} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function weekRange() {
  const s = startOfWeek(new Date()).getTime();
  return { from: s, to: s + 7 * 86400000 };
}
function prevWeekRange() {
  const s = startOfWeek(new Date()).getTime() - 7 * 86400000;
  return { from: s, to: s + 7 * 86400000 };
}
function monthRange() {
  const s = startOfMonth(new Date()).getTime();
  const e = new Date(s); e.setMonth(e.getMonth() + 1);
  return { from: s, to: e.getTime() };
}
function prevMonthRange() {
  const e = startOfMonth(new Date());
  const s = new Date(e); s.setMonth(s.getMonth() - 1);
  return { from: s.getTime(), to: e.getTime() };
}

function Block({ label, range, prevRange, api, isMonth }: { label: string; range: { from: number; to: number }; prevRange: { from: number; to: number }; api: TransactionsApi; isMonth?: boolean }) {
  const items = useMemo(() => txInRange(api.tx, range.from, range.to), [api.tx, range.from, range.to]);
  const prevItems = useMemo(() => txInRange(api.tx, prevRange.from, prevRange.to), [api.tx, prevRange.from, prevRange.to]);
  
  const totals = totalsByCategory(items);
  const total = items.reduce((s, t) => s + t.amount, 0);
  const prevTotal = prevItems.reduce((s, t) => s + t.amount, 0);

  const diff = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
  const isUp = diff > 0;

  // Forecast for month
  let forecastStr = "";
  if (isMonth && total > 0) {
    const now = new Date();
    const eom = new Date(range.from); eom.setMonth(eom.getMonth() + 1);
    const daysLeft = Math.floor((eom.getTime() - now.getTime()) / 86400000);
    const daysPassed = Math.floor((now.getTime() - range.from) / 86400000) || 1;
    const dailyAvg = total / daysPassed;
    const forecast = total + (dailyAvg * daysLeft);
    forecastStr = `At this pace, you'll spend ~${fmt(forecast)} this month.`;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No spending this {label} — yet.</p>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground flex flex-col gap-1">
          Total spent
          {forecastStr && <span className="text-[10px] text-muted-foreground/70 normal-case tracking-normal">{forecastStr}</span>}
        </p>
        <div className="text-right flex flex-col items-end">
          <span className="font-display text-3xl tabular">{fmt(total)}</span>
          {prevTotal > 0 && (
            <span className={`text-xs font-medium ${isUp ? 'text-destructive' : 'text-score-good'}`}>
              {isUp ? '+' : ''}{diff.toFixed(1)}% vs last {label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {(Object.keys(totals) as CategoryId[])
          .sort((a, b) => totals[b] - totals[a])
          .map((k) => {
            if (totals[k] === 0) return null;
            const c = CAT_MAP[k];
            const pct = total ? Math.round((totals[k] / total) * 100) : 0;
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground tabular">{pct}%</span>
                  </span>
                  <span className="font-mono-tabular">{fmt(totals[k])}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: `hsl(var(${c.colorVar}))` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
      
      <button 
        onClick={() => {
          const text = `I spent ${fmt(total)} this ${label} on Paisa. My top category was ${CAT_MAP[(Object.keys(totals) as CategoryId[]).sort((a,b) => totals[b]-totals[a])[0]]?.label}!`;
          if (navigator.share) {
            navigator.share({ title: 'My Paisa Recap', text });
          } else {
            navigator.clipboard.writeText(text);
            alert("Recap copied to clipboard!");
          }
        }}
        className="mt-6 w-full rounded-xl bg-secondary py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
      >
        Share Recap
      </button>
    </div>
  );
}

import { useState } from "react";
import { Plus } from "lucide-react";

function GoalsBlock({ api }: { api: TransactionsApi }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState("30");

  const handleAdd = () => {
    if (!name || !target) return;
    const dl = Date.now() + parseInt(days) * 86400000;
    api.addGoal(name, Number(target), dl);
    setAdding(false);
    setName(""); setTarget("");
  };

  return (
    <div>
      {api.goals.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-6 text-center">No active goals. Start saving!</p>
      )}

      {api.goals.map(g => {
        const now = Date.now();
        const daysLeft = Math.max(1, Math.ceil((g.deadlineMs - now) / 86400000));
        const remaining = g.target - g.saved;
        const dailyNeeded = remaining > 0 ? remaining / daysLeft : 0;
        const pct = Math.min(100, (g.saved / g.target) * 100);

        return (
          <div key={g.id} className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-medium text-sm">{g.name}</span>
              <span className="text-xs font-mono-tabular text-muted-foreground">{fmt(g.saved)} / {fmt(g.target)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
            </div>
            {remaining > 0 && (
              <p className="text-[10px] text-muted-foreground">Save {fmt(dailyNeeded)}/day for {daysLeft} days to reach target.</p>
            )}
          </div>
        );
      })}

      {!adding ? (
        <button onClick={() => setAdding(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" /> Add Goal
        </button>
      ) : (
        <div className="mt-4 space-y-3 bg-secondary/30 p-4 rounded-xl border">
          <input type="text" placeholder="Goal name (e.g. Goa trip)" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder="Target amount" value={target} onChange={e => setTarget(e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
            <select value={days} onChange={e => setDays(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="7">1 week</option>
              <option value="30">1 month</option>
              <option value="90">3 months</option>
              <option value="180">6 months</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 rounded-lg bg-foreground text-background py-2 text-sm font-medium">Save Goal</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
