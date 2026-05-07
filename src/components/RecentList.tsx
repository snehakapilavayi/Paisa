import { useMemo, useState } from "react";
import { CAT_MAP, CATEGORIES, CategoryId } from "@/lib/categories";
import { fmt, spikes } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";
import { AlertTriangle, Trash2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function RecentList({ api }: { api: TransactionsApi }) {
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const [search, setSearch] = useState("");
  const spikeIds = useMemo(() => new Set(spikes(api.tx).map((s) => s.id)), [api.tx]);

  const items = useMemo(() => {
    let base = filter === "all" ? api.tx : api.tx.filter((t) => t.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((t) => {
        const isAmt = t.amount.toString().includes(q);
        const isNote = t.note?.toLowerCase().includes(q);
        const isMood = t.mood === q;
        return isAmt || isNote || isMood;
      });
    }
    return base.slice(0, 30);
  }, [api.tx, filter, search]);

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search amount, note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border bg-secondary/50 pl-8 pr-4 py-2 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.emoji} {c.label}
          </FilterChip>
        ))}
      </div>

      {/* List */}
      <ul className="divide-y divide-border/50">
        {items.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">
            {api.tx.length === 0 ? "No expenses yet. Tap + to log one." : "No matches found."}
          </li>
        )}
        {items.map((t) => {
          const c = CAT_MAP[t.category];
          const isSpike = spikeIds.has(t.id);
          const d = new Date(t.ts);
          return (
            <li key={t.id} className="flex items-center gap-3 py-3 group">
              {/* Icon */}
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-lg shrink-0"
                style={{ backgroundColor: `hsl(var(${c.colorVar}) / 0.15)` }}
              >
                {t.mood ? t.mood : c.emoji}
              </span>

              {/* Info — tap to recategorize */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 min-w-0 text-left">
                    <p className="font-medium leading-tight flex items-center gap-1.5 truncate">
                      {c.label}
                      {t.note && (
                        <span className="text-muted-foreground font-normal truncate max-w-[120px]">
                          · {t.note}
                        </span>
                      )}
                      {isSpike && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-2">
                  <p className="px-2 py-1 text-xs text-muted-foreground mb-1">Move to category</p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => api.recategorize(t.id, opt.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted transition-colors",
                          opt.id === t.category && "bg-muted"
                        )}
                      >
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Amount */}
              <span className="font-mono text-sm tabular-nums shrink-0">{fmt(t.amount)}</span>

              {/* Delete — always visible, pops red on hover */}
              <button
                onClick={() => api.remove(t.id)}
                aria-label="Delete"
                className="ml-1 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-40 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

