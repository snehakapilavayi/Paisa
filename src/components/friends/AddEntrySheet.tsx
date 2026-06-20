import { useState, useRef, useEffect } from "react";
import { FriendsApi } from "@/hooks/use-friends";
import { Person, LendBorrowEntry, QUICK_REASONS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/finance";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Search, Plus, X, ChevronDown, ChevronUp, Calendar } from "lucide-react";

type Step = "person" | "amount";

interface AddEntrySheetProps {
  api: FriendsApi;
  open: boolean;
  type: "lent" | "borrowed";
  onClose: () => void;
}

export function AddEntrySheet({ api, open, type, onClose }: AddEntrySheetProps) {
  const [step, setStep] = useState<Step>("person");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [optReason, setOptReason] = useState("");
  const [optNote, setOptNote] = useState("");
  const [optDate, setOptDate] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("person");
    setSelectedPerson(null);
    setSearch("");
    setAmount("");
    setShowOptional(false);
    setSavedEntryId(null);
    setOptReason("");
    setOptNote("");
    setOptDate("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    if (step === "amount") {
      setTimeout(() => amountRef.current?.focus(), 80);
    }
    if (step === "person") {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [step]);

  const filteredPeople = api.sortedPeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectPerson = (p: Person) => {
    setSelectedPerson(p);
    setSearch("");
    setStep("amount");
  };

  const handleAddNew = () => {
    if (!search.trim()) return;
    const p = api.addPerson(search.trim());
    setSelectedPerson(p);
    setSearch("");
    setStep("amount");
  };

  const handleSave = () => {
    if (!selectedPerson) return;
    const n = Number(amount);
    if (!n || n <= 0) return;

    const entry = api.addEntry(selectedPerson.id, type, n);
    setSavedEntryId(entry.id);

    const verb = type === "lent" ? "Lent" : "Borrowed";
    toast.success(`✔ ${verb} ${fmt(n)} ${type === "lent" ? "to" : "from"} ${selectedPerson.name}`, {
      description: "Tap to add reason or notes",
      action: { label: "Details", onClick: () => setShowOptional(true) },
    });
  };

  const handleSaveOptional = () => {
    if (!savedEntryId) return;
    api.updateEntry(savedEntryId, {
      reason: optReason || undefined,
      note: optNote || undefined,
      expectedReturnMs: optDate ? new Date(optDate).getTime() : undefined,
    });
    toast.success("Details saved!");
    onClose();
  };

  const isSaved = !!savedEntryId;
  const typeColor = type === "lent" ? "text-emerald-600" : "text-rose-500";
  const typeBg = type === "lent" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30";
  const typeBorder = type === "lent" ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t p-0 max-h-[92vh] overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-xl px-3 py-1 text-sm font-semibold border", typeBg, typeBorder, typeColor)}>
                {type === "lent" ? "💸 I Lent" : "📥 I Borrowed"}
              </div>
              {selectedPerson && step === "amount" && (
                <span className="text-muted-foreground text-sm">→ {selectedPerson.name}</span>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="px-6 pb-8 pt-4 space-y-4">

          {/* ── STEP 1: Person Select ─────────────────────────────── */}
          {step === "person" && !isSaved && (
            <div className="space-y-3 animate-pop-in">
              <SheetTitle className="font-display text-2xl tracking-tight">Who?</SheetTitle>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  placeholder="Search or add person..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && search.trim() && filteredPeople.length === 0) handleAddNew(); }}
                  className="w-full rounded-2xl border bg-secondary/30 pl-11 pr-4 py-3.5 text-base outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* People list */}
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                {filteredPeople.map((p) => {
                  const bal = api.getNetBalance(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPerson(p)}
                      className="w-full flex items-center justify-between rounded-2xl border bg-card hover:bg-secondary/40 px-4 py-3 transition-colors active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm">
                          {p.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      {bal !== 0 && (
                        <span className={cn("text-sm font-semibold tabular", bal > 0 ? "text-emerald-600" : "text-rose-500")}>
                          {bal > 0 ? "+" : ""}{fmt(Math.abs(bal))}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Add new */}
                {search.trim() && !filteredPeople.find((p) => p.name.toLowerCase() === search.toLowerCase()) && (
                  <button
                    onClick={handleAddNew}
                    className="w-full flex items-center gap-3 rounded-2xl border border-dashed bg-card hover:bg-secondary/40 px-4 py-3 transition-colors active:scale-[0.98]"
                  >
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Add "{search.trim()}"</span>
                  </button>
                )}

                {filteredPeople.length === 0 && !search.trim() && (
                  <p className="text-center text-muted-foreground py-6 text-sm">Start typing a name to add a person</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Amount ───────────────────────────────────── */}
          {step === "amount" && !isSaved && (
            <div className="space-y-4 animate-pop-in">
              <SheetTitle className="font-display text-2xl tracking-tight">How much?</SheetTitle>

              {/* Amount input */}
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-muted-foreground font-display">₹</span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && Number(amount) > 0) handleSave(); }}
                  className="w-full rounded-2xl border bg-secondary/30 pl-14 pr-5 py-4 text-4xl font-display outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Back + Save */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("person")}
                  className="rounded-2xl border bg-secondary/30 px-5 py-4 font-semibold text-muted-foreground transition-colors hover:bg-secondary/60"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!amount || Number(amount) <= 0}
                  className={cn(
                    "flex-1 rounded-2xl py-4 font-semibold text-white disabled:opacity-30 transition-all",
                    type === "lent" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                  )}
                >
                  {amount ? `Save ${fmt(Number(amount))}` : "Enter Amount"}
                </button>
              </div>
            </div>
          )}

          {/* ── POST-SAVE: Optional extras ───────────────────────── */}
          {isSaved && (
            <div className="space-y-4 animate-pop-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saved!</p>
                  <SheetTitle className="font-display text-xl tracking-tight mt-0.5">
                    Add details? <span className="text-muted-foreground font-sans text-base font-normal">(optional)</span>
                  </SheetTitle>
                </div>
                <button onClick={onClose} className="rounded-2xl border bg-secondary/30 px-5 py-2.5 text-sm font-semibold">
                  Done
                </button>
              </div>

              {/* Reason chips */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reason</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setOptReason(optReason === r ? "" : r)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                        optReason === r
                          ? "bg-foreground text-background border-foreground"
                          : "bg-secondary/30 border-border hover:bg-secondary/60"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Note</p>
                <textarea
                  placeholder="Paid via UPI, will return next week..."
                  value={optNote}
                  onChange={(e) => setOptNote(e.target.value)}
                  className="w-full rounded-2xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none h-20 placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Expected date */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Expected Return Date
                </p>
                <input
                  type="date"
                  value={optDate}
                  onChange={(e) => setOptDate(e.target.value)}
                  className="w-full rounded-2xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>

              {(optReason || optNote || optDate) && (
                <button
                  onClick={handleSaveOptional}
                  className="w-full rounded-2xl bg-foreground py-3.5 font-semibold text-background"
                >
                  Save Details
                </button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
