import { useState, useEffect } from "react";
import { CATEGORIES, CategoryId } from "@/lib/categories";
import { TransactionsApi } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { parseNaturalLanguage } from "@/lib/finance";

const MOODS = ["😄", "🙂", "😐", "😓", "😡"];

export function QuickLog({ api }: { api: TransactionsApi }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("");
  const [nlpInput, setNlpInput] = useState("");

  const reset = () => { setAmount(""); setCat(null); setNote(""); setMood(""); setNlpInput(""); };

  useEffect(() => {
    if (nlpInput) {
      const parsed = parseNaturalLanguage(nlpInput);
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.category) setCat(parsed.category);
      setNote(parsed.note);
    }
  }, [nlpInput]);



  const submit = (chosen?: CategoryId) => {
    const c = chosen ?? cat ?? "random"; // default to random if AI doesn't guess
    const n = Number(amount);
    if (!n || n <= 0) return;
    const newTx = api.add(n, c, note, mood);
    
    // AI Insights logic
    const thisWeek = api.tx.filter(t => t.ts > Date.now() - 7 * 86400000 && t.category === c);
    const count = thisWeek.length + 1;
    let msg = `Logged ₹${n}`;
    let desc = `Nice!`;

    if (c === "food") {
      desc = count > 2 ? `That's your ${count}th food order this week 👀` : "Enjoy your food!";
    } else if (c === "shopping") {
      desc = "Retail therapy? 🛍️";
    } else if (n > 500) {
      desc = "Big spender! 💸";
    } else {
      desc = "Awareness +1 ✨";
    }

    toast.success(msg, {
      description: desc,
    });
    reset();
    setOpen(false);
  };

  const display = amount === "" ? "0" : amount;

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetTrigger asChild>
        <button
          aria-label="Quick log expense"
          className="fixed bottom-[96px] right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#10b981] text-white shadow-lift transition-transform active:scale-95 hover:scale-105 animate-bounce"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl border-t p-0 max-h-[92vh] overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="font-display text-2xl tracking-tight">Quick log</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-4">
          <textarea
            autoFocus
            placeholder='e.g. "Spent 120 on shawarma"'
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            className="w-full rounded-2xl border bg-secondary/30 px-5 py-4 text-lg outline-none focus:border-foreground transition-colors resize-none h-32 placeholder:text-muted-foreground/50"
          />

          <div className="flex gap-2 justify-center py-2">
            {MOODS.map(m => (
              <button
                key={m}
                onClick={() => setMood(m === mood ? "" : m)}
                className={cn("text-3xl transition-transform active:scale-90", mood === m ? "scale-110 drop-shadow-md" : "opacity-40 hover:opacity-100 grayscale hover:grayscale-0")}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => submit()}
            disabled={!amount || (!cat && !amount)}
            className="w-full rounded-2xl bg-foreground py-4 font-semibold text-background disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
          >
            {amount ? `Log ₹${amount}` : "Waiting for amount..."}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
