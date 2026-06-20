import { useState } from "react";
import { TransactionsApi } from "@/hooks/use-transactions";
import { fmt } from "@/lib/finance";
import { Plus, Minus, Trash2, PiggyBank, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Savings({ api }: { api: TransactionsApi }) {
  const { goals, addGoal, updateGoal, removeGoal } = api;

  // New goal sheet state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  // Inline adjustment state
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");

  const handleAddGoal = () => {
    const targetVal = Number(target);
    if (name.trim() && targetVal > 0) {
      const deadlineMs = deadline ? new Date(deadline).getTime() : 0;
      addGoal(name, targetVal, deadlineMs);
      setName("");
      setTarget("");
      setDeadline("");
      setOpen(false);
    }
  };

  const handleDeposit = (goalId: string, currentSaved: number, targetVal: number) => {
    const amt = Number(adjustAmount);
    if (amt > 0) {
      updateGoal(goalId, Math.min(targetVal, currentSaved + amt));
      setAdjustAmount("");
    }
  };

  const handleWithdraw = (goalId: string, currentSaved: number) => {
    const amt = Number(adjustAmount);
    if (amt > 0) {
      updateGoal(goalId, Math.max(0, currentSaved - amt));
      setAdjustAmount("");
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const completedGoalsCount = goals.filter((g) => g.saved >= g.target).length;
  const activeGoalsCount = goals.length - completedGoalsCount;

  return (
    <div className="space-y-6 animate-pop-in">
      {/* Total Savings Card */}
      <section className="rounded-3xl border bg-card p-6 shadow-soft relative overflow-hidden bg-gradient-to-br from-card to-accent/5">
        <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] select-none pointer-events-none">💰</div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stash Total</p>
          <PiggyBank className="h-5 w-5 text-accent" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-4xl tracking-tight leading-none mb-2">{fmt(totalSaved)}</span>
          <p className="text-xs text-muted-foreground">
            {goals.length === 0
              ? "Create a goal to start saving!"
              : `${completedGoalsCount} achieved · ${activeGoalsCount} in progress`}
          </p>
        </div>
      </section>

      {/* Goals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-tight mb-1">Savings Goals</h2>
            <p className="text-sm text-muted-foreground">Dream big, save small</p>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="h-9 rounded-full bg-accent text-accent-foreground px-4 flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95 text-xs font-semibold"
                aria-label="Add new goal"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Goal
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-t p-0">
              <SheetHeader className="px-6 pt-6 pb-2">
                <SheetTitle className="font-display text-2xl tracking-tight">Create Savings Goal</SheetTitle>
              </SheetHeader>
              <div className="px-6 pb-8 space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What are you saving for?</label>
                  <input
                    type="text"
                    placeholder="e.g. Goa Trip, New iPad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors text-muted-foreground focus:text-foreground"
                  />
                </div>

                <button
                  onClick={handleAddGoal}
                  disabled={!name.trim() || !target || Number(target) <= 0}
                  className="w-full rounded-2xl bg-foreground py-4 font-semibold text-background disabled:opacity-30 transition-opacity mt-4 flex items-center justify-center gap-2"
                >
                  Create Goal
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {goals.map((g) => {
            const isCompleted = g.saved >= g.target;
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            const isExpanded = expandedGoalId === g.id;

            return (
              <div
                key={g.id}
                className="rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200"
              >
                {/* Header info */}
                <div
                  className="flex justify-between items-start cursor-pointer select-none"
                  onClick={() => {
                    setExpandedGoalId(isExpanded ? null : g.id);
                    setAdjustAmount("");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{g.name}</span>
                      {isCompleted && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-semibold text-accent-foreground border border-accent/25 animate-pulse">
                          🎉 Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{fmt(g.saved)} saved</span>
                      <span>·</span>
                      <span>{fmt(g.target)} target</span>
                      {g.deadlineMs > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(g.deadlineMs).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{pct}%</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <Progress value={pct} className="[&>div]:bg-accent h-2" />
                </div>

                {/* Expandable deposit / withdraw panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dashed space-y-4 animate-pop-in">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="flex-1 min-w-0 rounded-xl border bg-secondary/20 px-3.5 py-2 text-sm outline-none focus:border-foreground transition-colors"
                      />
                      <button
                        onClick={() => handleDeposit(g.id, g.saved, g.target)}
                        disabled={!adjustAmount || Number(adjustAmount) <= 0}
                        className="rounded-xl bg-accent text-accent-foreground px-4 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 transition-opacity active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Deposit
                      </button>
                      <button
                        onClick={() => handleWithdraw(g.id, g.saved)}
                        disabled={!adjustAmount || Number(adjustAmount) <= 0 || g.saved <= 0}
                        className="rounded-xl border border-border bg-background hover:bg-secondary px-4 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 transition-opacity active:scale-95"
                      >
                        <Minus className="h-3.5 w-3.5" />
                        Withdraw
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-muted-foreground">
                        Adjust this goal's saved cash jar balance
                      </p>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this savings goal?")) {
                            removeGoal(g.id);
                          }
                        }}
                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Goal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="rounded-2xl border border-dashed py-8 text-center bg-card/40">
              <PiggyBank className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No savings goals yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap "Add Goal" to set a new target!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
