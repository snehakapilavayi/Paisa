import { useMemo } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { CATEGORIES } from "@/lib/categories";
import { startOfWeek, fmt } from "@/lib/finance";

export function Analytics({ api }: { api: TransactionsApi }) {
  const weekStart = startOfWeek(new Date()).getTime();
  
  const { pieData, barData } = useMemo(() => {
    // Pie data for all time or this week
    const totals = { food: 0, travel: 0, shopping: 0, random: 0 };
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + i * 86400000);
      return { 
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        amount: 0,
        ts: d.getTime()
      };
    });

    api.tx.forEach(t => {
      totals[t.category] += t.amount;
      
      const tDay = new Date(t.ts);
      tDay.setHours(0,0,0,0);
      const dayIdx = days.findIndex(d => d.ts === tDay.getTime());
      if (dayIdx !== -1) {
        days[dayIdx].amount += t.amount;
      }
    });

    const pData = CATEGORIES.map(c => ({
      name: c.label,
      value: totals[c.id],
      color: `hsl(var(${c.colorVar}))`
    })).filter(d => d.value > 0);

    return { pieData: pData, barData: days };
  }, [api.tx, weekStart]);

  return (
    <div className="space-y-6 animate-pop-in">
      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-xl tracking-tight mb-4">Spending by Category</h2>
        {pieData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'var(--shadow-lift)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">No data to display yet.</p>
        )}
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-xl tracking-tight mb-4">This Week's Activity</h2>
        <div className="h-48 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                formatter={(value: number) => [fmt(value), "Spent"]}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'var(--shadow-lift)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
              />
              <Bar dataKey="amount" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
