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

  const handlePad = (k: string) => {
    setAmount((v) => {
      if (k === "del") return v.slice(0, -1);
      if (k === "." && v.includes(".")) return v;
      if (v === "0" && k !== ".") return k;
      const next = v + k;
      const [, dec] = next.split(".");
      if (dec && dec.length > 2) return v;
      if (next.length > 8) return v;
      return next;
    });
  };

  const submit = (chosen?: CategoryId) => {
    const c = chosen ?? cat;
    const n = Number(amount);
    if (!c || !n || n <= 0) return;
    const newTx = api.add(n, c, note, mood);
    toast.success(`Logged ${mood} · ${CATEGORIES.find((x) => x.id === c)!.label}`, {
      description: `₹${n.toFixed(n % 1 ? 2 : 0)} ${note ? `"${note}"` : ""}`,
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
          className="absolute bottom-[calc(var(--nav-height)+max(var(--safe-bottom),0px)+12px)] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lift animate-pulse-ring transition-transform active:scale-95 hover:scale-105"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl border-t p-0 max-h-[92vh] overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="font-display text-2xl tracking-tight">Quick log</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-4">
          <input
            type="text"
            placeholder='Type "spent 120 on lunch"'
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            className="w-full rounded-xl border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
          />

          <div className="flex items-baseline justify-center gap-1 py-2">
            <span className="font-display text-4xl text-muted-foreground">₹</span>
            <span className="font-display text-7xl tabular tracking-tight">{display}</span>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCat(c.id); if (amount) submit(c.id); }}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 transition-all active:scale-95",
                  cat === c.id ? "border-foreground shadow-soft" : "hover:border-foreground/40"
                )}
                style={cat === c.id ? { backgroundColor: `hsl(var(${c.colorVar}) / 0.12)` } : undefined}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-center py-1">
            {MOODS.map(m => (
              <button
                key={m}
                onClick={() => setMood(m === mood ? "" : m)}
                className={cn("text-2xl transition-transform active:scale-90", mood === m ? "scale-125" : "opacity-50 hover:opacity-100")}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9",".","0","del"].map((k) => (
              <button
                key={k}
                onClick={() => handlePad(k)}
                className="rounded-2xl bg-secondary py-4 text-2xl font-medium tabular transition-colors hover:bg-muted active:scale-[0.98]"
              >
                {k === "del" ? "⌫" : k}
              </button>
            ))}
          </div>

          <button
            onClick={() => submit()}
            disabled={!amount || !cat}
            className="w-full rounded-2xl bg-foreground py-4 font-semibold text-background disabled:opacity-30 transition-opacity"
          >
            Log expense
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
