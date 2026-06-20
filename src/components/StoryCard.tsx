import { useMemo } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { totalsByCategory } from "@/lib/finance";

export function StoryCard({ api }: { api: TransactionsApi }) {
  const { tx } = api;

  const insights = useMemo(() => {
    if (tx.length === 0) return { title: "Quiet start", desc: "No spending logged yet. Keep your money safe!" };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const todayTx = tx.filter(t => t.ts >= todayMs);
    const todayTotal = todayTx.reduce((s, t) => s + t.amount, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekMs = weekStart.getTime();
    const weekTx = tx.filter(t => t.ts >= weekMs);

    const totals = totalsByCategory(weekTx);
    const highestCat = (Object.keys(totals) as Array<keyof typeof totals>).reduce((a, b) => totals[a] > totals[b] ? a : b);

    // AI generated insights
    let title = "Your money story 📖";
    let desc = "";

    if (todayTotal === 0 && tx.length > 0) {
      title = "No spend day! 🎉";
      desc = "You haven't spent anything today. A calm day for your wallet.";
    } else if (todayTotal > 1000) {
      title = "Heavy day 💸";
      desc = "You've spent quite a bit today. Treat yourself, but stay aware!";
    } else if (highestCat === "food" && totals.food > totals.shopping) {
      title = "The Foodie 🍔";
      desc = "Most of your money recently disappeared into food and snacks.";
    } else if (highestCat === "shopping") {
      title = "Retail Therapy 🛍️";
      desc = "Shopping took the biggest slice of your pie recently.";
    } else {
      title = "Consistent Spender ✨";
      desc = "Your spending is nicely balanced. Keep up the good awareness!";
    }

    return { title, desc, highestCat, weekTotal: weekTx.reduce((s,t) => s+t.amount, 0), totals };
  }, [tx]);

  if (tx.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-6 shadow-soft flex flex-col gap-2 relative overflow-hidden">
        <h3 className="font-display text-xl tracking-tight">Financial Awareness</h3>
        <p className="text-sm text-muted-foreground">Log your first expense to see where your money goes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] select-none pointer-events-none">👀</div>
      <h3 className="font-display text-xl tracking-tight">{insights.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {insights.desc}
      </p>
      
      <div className="mt-4 rounded-2xl bg-secondary/40 p-4 border border-secondary/60">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Where it disappeared this week</p>
        <div className="space-y-2">
          {insights.totals.food > 0 && <div className="flex justify-between text-sm"><span>🍜 Food & Snacks</span><span className="font-mono">₹{insights.totals.food}</span></div>}
          {insights.totals.shopping > 0 && <div className="flex justify-between text-sm"><span>🛍️ Shopping</span><span className="font-mono">₹{insights.totals.shopping}</span></div>}
          {insights.totals.travel > 0 && <div className="flex justify-between text-sm"><span>🚇 Travel</span><span className="font-mono">₹{insights.totals.travel}</span></div>}
          {insights.totals.random > 0 && <div className="flex justify-between text-sm"><span>✨ Random</span><span className="font-mono">₹{insights.totals.random}</span></div>}
        </div>
      </div>
    </div>
  );
}
