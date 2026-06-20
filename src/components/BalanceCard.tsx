import { useState } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { Plus, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { fmt } from "@/lib/finance";

export function BalanceCard({ api }: { api: TransactionsApi }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const val = Number(amount);
    if (val > 0) {
      api.addBalance(val);
      setAmount("");
      setOpen(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl bg-secondary/30 p-5 border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
            <h2 className="text-2xl font-display tracking-tight">{fmt(api.balance || 0)}</h2>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="fixed bottom-[96px] left-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#10b981] text-white shadow-lift transition-transform active:scale-95 hover:scale-105 animate-bounce">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl border-t p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="font-display text-2xl tracking-tight">Add Money</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-8 space-y-4 mt-2">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">₹</span>
              <input
                type="number"
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border bg-secondary/30 pl-12 pr-5 py-4 text-3xl font-display outline-none focus:border-foreground transition-colors"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!amount || Number(amount) <= 0}
              className="w-full rounded-2xl bg-foreground py-4 font-semibold text-background disabled:opacity-30 transition-opacity mt-4 flex items-center justify-center gap-2"
            >
              Add to Balance
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
