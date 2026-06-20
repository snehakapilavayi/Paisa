import { storage } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";
import { Settings2, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
export function SettingsPanel({ api }: { api: TransactionsApi }) {


  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-full border bg-card p-2.5 hover:bg-secondary transition-colors" aria-label="Settings">
          <Settings2 className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-tight">Tune Paisa</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">


          {/* Danger zone */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive/80 mb-1">Danger zone</p>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete all your transactions and settings. This cannot be undone.</p>
            <button
              onClick={() => {
                if (window.confirm("Delete everything? This cannot be undone.")) {
                  storage.clearAll();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Clear all data
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-2">
            All data lives on this device only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

