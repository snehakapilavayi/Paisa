import { useMemo } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { startOfWeek, txInRange } from "@/lib/finance";
import { CheckCircle2, Circle } from "lucide-react";

export function Challenges({ api }: { api: TransactionsApi }) {
  const progress = useMemo(() => {
    const s = startOfWeek(new Date()).getTime();
    const weekTx = txInRange(api.tx, s, s + 7 * 86400000);
    
    const noShopping = weekTx.filter(t => t.category === "shopping").length === 0;
    const under500Food = weekTx.filter(t => t.category === "food").reduce((sum, t) => sum + t.amount, 0) < 500;

    return [
      { id: 1, label: "No shopping this week", done: noShopping },
      { id: 2, label: "Keep food under ₹500", done: under500Food },
    ];
  }, [api.tx]);

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h3 className="font-display text-2xl tracking-tight mb-4">Weekly Challenges</h3>
      <div className="space-y-3">
        {progress.map(c => (
          <div key={c.id} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl">
            {c.done ? <CheckCircle2 className="h-5 w-5 text-score-good" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            <span className={c.done ? "text-foreground font-medium" : "text-muted-foreground"}>
              {c.label}
            </span>
            {c.done && <span className="ml-auto text-xs font-bold text-score-good bg-score-good/10 px-2 py-0.5 rounded-full">+10 pts</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
