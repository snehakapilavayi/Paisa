import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FriendsFabProps {
  onSelect: (type: "lent" | "borrowed") => void;
}

export function FriendsFab({ onSelect }: FriendsFabProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type: "lent" | "borrowed") => {
    setOpen(false);
    onSelect(type);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Option buttons — appear above FAB when open */}
      <div className={cn(
        "fixed bottom-[172px] right-5 z-40 flex flex-col gap-3 items-end transition-all duration-200",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <button
          onClick={() => handleSelect("lent")}
          className="flex items-center gap-3 rounded-2xl bg-white dark:bg-card border border-emerald-200 dark:border-emerald-800 shadow-lift px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all active:scale-95"
        >
          I Lent Money
          <span className="text-xl">💸</span>
        </button>
        <button
          onClick={() => handleSelect("borrowed")}
          className="flex items-center gap-3 rounded-2xl bg-white dark:bg-card border border-rose-200 dark:border-rose-800 shadow-lift px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95"
        >
          I Borrowed Money
          <span className="text-xl">📥</span>
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Log lending or borrowing"
        className={cn(
          "fixed bottom-[96px] right-5 z-40 grid h-14 w-14 place-items-center rounded-full shadow-lift transition-all duration-200 active:scale-95",
          "bg-[#10b981] text-white",
          open ? "rotate-45 scale-110" : "animate-bounce hover:scale-105"
        )}
      >
        {open ? <X className="h-6 w-6" strokeWidth={2.5} /> : <Plus className="h-6 w-6" strokeWidth={2.5} />}
      </button>
    </>
  );
}
