import { TransactionsApi } from "@/hooks/use-transactions";
import { CATEGORIES } from "@/lib/categories";
import { fmt, weeklyScore } from "@/lib/finance";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function Budgets({ api }: { api: TransactionsApi }) {
  const { breakdown } = weeklyScore(api.tx, api.benchmarks);

  return (
    <div className="space-y-6 animate-pop-in">
      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-xl tracking-tight mb-1">Weekly Budgets</h2>
        <p className="text-sm text-muted-foreground mb-6">Track your spending limits</p>
        
        <div className="space-y-5">
          {CATEGORIES.map(c => {
            const b = breakdown[c.id];
            const pct = Math.min(100, Math.round((b.spent / (b.budget || 1)) * 100));
            const isOver = b.spent > b.budget;
            
            return (
              <div key={c.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="font-medium text-sm">{c.label}</span>
                  </div>
                  <div className="text-sm">
                    <span className={isOver ? "text-destructive font-medium" : ""}>{fmt(b.spent)}</span>
                    <span className="text-muted-foreground"> / {fmt(b.budget)}</span>
                  </div>
                </div>
                <Progress value={pct} className={isOver ? "[&>div]:bg-destructive" : ""} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl tracking-tight mb-1">Savings Goals</h2>
            <p className="text-sm text-muted-foreground">Dream big, save small</p>
          </div>
          <button className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {api.goals.map(g => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <div key={g.id} className="p-4 border rounded-2xl bg-background shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">{g.name}</h3>
                  <span className="text-sm font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="[&>div]:bg-accent" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{fmt(g.saved)} saved</span>
                  <span>{fmt(g.target)} goal</span>
                </div>
              </div>
            );
          })}
          {api.goals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No goals yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
