import { useMemo } from "react";
import { insightSentence } from "@/lib/finance";
import { TransactionsApi } from "@/hooks/use-transactions";

export function InsightLine({ api }: { api: TransactionsApi }) {
  const line = useMemo(() => insightSentence(api.tx, api.benchmarks), [api.tx, api.benchmarks]);
  return (
    <section className="px-1">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">In one line</p>
      <p className="mt-2 font-display text-2xl sm:text-3xl leading-snug tracking-tight">
        “{line}”
      </p>
    </section>
  );
}
