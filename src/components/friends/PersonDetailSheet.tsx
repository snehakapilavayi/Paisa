import { useState } from "react";
import { FriendsApi } from "@/hooks/use-friends";
import { LendBorrowEntry, Person } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/finance";
import { remainingBalance } from "@/lib/friends";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Check, RefreshCw, X } from "lucide-react";

type Filter = "all" | "active" | "settled" | "lent" | "borrowed";

interface PersonDetailSheetProps {
  api: FriendsApi;
  person: Person | null;
  onClose: () => void;
}

export function PersonDetailSheet({ api, person, onClose }: PersonDetailSheetProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [repayingEntryId, setRepayingEntryId] = useState<string | null>(null);
  const [repayAmt, setRepayAmt] = useState("");

  if (!person) return null;

  const allEntries = api.getEntriesFor(person.id);

  const filteredEntries = allEntries.filter((e) => {
    if (filter === "active") return !e.settled;
    if (filter === "settled") return e.settled;
    if (filter === "lent") return e.type === "lent";
    if (filter === "borrowed") return e.type === "borrowed";
    return true;
  });

  const totalLent = allEntries
    .filter((e) => e.type === "lent")
    .reduce((s, e) => s + e.amount, 0);
  const totalBorrowed = allEntries
    .filter((e) => e.type === "borrowed")
    .reduce((s, e) => s + e.amount, 0);
  const net = api.getNetBalance(person.id);

  const handleRepay = (entry: LendBorrowEntry) => {
    const n = Number(repayAmt);
    if (!n || n <= 0) return;
    const rem = remainingBalance(entry);
    if (n > rem) {
      toast.error(`Amount exceeds remaining balance of ${fmt(rem)}`);
      return;
    }
    api.addRepayment(entry.id, n);
    const newRem = rem - n;
    if (newRem <= 0) {
      toast.success(`✔ Settled with ${person.name}!`);
    } else {
      toast.success(`Repayment of ${fmt(n)} recorded. ${fmt(newRem)} remaining.`);
    }
    setRepayingEntryId(null);
    setRepayAmt("");
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "settled", label: "Settled" },
    { id: "lent", label: "Lent" },
    { id: "borrowed", label: "Borrowed" },
  ];

  return (
    <Sheet open={!!person} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t p-0 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-xl">
                {person.name[0].toUpperCase()}
              </div>
              <div>
                <SheetTitle className="font-display text-2xl tracking-tight leading-none">
                  {person.name}
                </SheetTitle>
                <p className={cn(
                  "text-sm font-semibold mt-1",
                  net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-500" : "text-muted-foreground"
                )}>
                  {net > 0
                    ? `Owes you ${fmt(net)}`
                    : net < 0
                    ? `You owe ${fmt(Math.abs(net))}`
                    : "All settled ✓"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        {/* Summary row */}
        <div className="mx-6 mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Lent</p>
            <p className="text-xl font-display font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">{fmt(totalLent)}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-3">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Borrowed</p>
            <p className="text-xl font-display font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{fmt(totalBorrowed)}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-6 mt-4 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all",
                filter === f.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="px-6 pt-3 pb-8 space-y-3">
          {filteredEntries.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No transactions here yet.
            </div>
          )}

          {filteredEntries.map((entry) => {
            const rem = remainingBalance(entry);
            const isLent = entry.type === "lent";
            const isRepaying = repayingEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className="rounded-2xl border bg-card p-4 space-y-3"
              >
                {/* Entry header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center",
                      isLent ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-rose-100 dark:bg-rose-950/50"
                    )}>
                      {isLent
                        ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        : <ArrowDownLeft className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{fmt(entry.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isLent ? "You lent" : "You borrowed"} · {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.settled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1">
                        <Check className="w-3 h-3" /> Settled
                      </span>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className={cn("font-semibold", isLent ? "text-emerald-600" : "text-rose-500")}>
                          {fmt(rem)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason / Note */}
                {(entry.reason || entry.note) && (
                  <div className="bg-secondary/30 rounded-xl px-3 py-2 space-y-0.5">
                    {entry.reason && <p className="text-xs font-semibold text-muted-foreground">{entry.reason}</p>}
                    {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  </div>
                )}

                {/* Repayments */}
                {entry.repayments.length > 0 && (
                  <div className="space-y-1">
                    {entry.repayments.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Repayment · {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {r.note && ` · ${r.note}`}
                        </span>
                        <span className="font-semibold tabular">{fmt(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Repay inline form */}
                {!entry.settled && (
                  <>
                    {isRepaying ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-display">₹</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            autoFocus
                            placeholder="Amount"
                            value={repayAmt}
                            onChange={(e) => setRepayAmt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRepay(entry); }}
                            className="w-full rounded-xl border bg-secondary/30 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => handleRepay(entry)}
                          disabled={!repayAmt || Number(repayAmt) <= 0}
                          className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold disabled:opacity-30 transition-opacity"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => { setRepayingEntryId(null); setRepayAmt(""); }}
                          className="rounded-xl border px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRepayingEntryId(entry.id); setRepayAmt(""); }}
                        className="w-full rounded-xl border border-dashed py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Record Repayment
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
