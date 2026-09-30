import { useEffect } from "react";
import { Zap, ArrowRight, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { H2HTip as H2HTipType } from "@shared/schema";
import { trackHorizonTipDisplay } from "@/lib/analytics";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

type Props = {
  tips: H2HTipType[];
};

export function H2HTips({ tips }: Props) {
  useEffect(() => {
    if (tips && tips.length > 0) {
      const maxSavings = Math.max(...tips.map(t => t.savings));
      trackHorizonTipDisplay("component", maxSavings);
    }
  }, [tips]);

  if (!tips || tips.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {tips.map((tip, idx) => (
        <div
          key={idx}
          data-testid={`h2h-tip-${idx}`}
          className="rounded-md p-4 flex items-start gap-3 flex-wrap"
          style={{
            background: "hsl(22 79% 75% / 0.06)",
            border: "1px solid hsl(22 79% 75% / 0.28)",
          }}
        >
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "hsl(22 79% 75% / 0.12)" }}
          >
            <Zap className="h-4 w-4" style={{ color: "hsl(22 79% 75%)" }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "hsl(22 79% 75%)" }}
              >
                Horizon's Tip
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-sm font-semibold"
                style={{
                  background: "hsl(22 79% 75% / 0.12)",
                  color: "hsl(22 79% 75%)",
                }}
              >
                Save {tip.savingsPercent.toFixed(0)}%
              </span>
            </div>

            <p className="text-sm font-semibold text-foreground mb-0.5">
              Fly{" "}
              {tip.direction === "origin" ? "from" : "to"}{" "}
              <span className="font-bold">{tip.alternateName}</span>{" "}
              to save{" "}
              <span className="font-bold" style={{ color: "hsl(145 65% 55%)" }}>
                {formatCurrency(String((parseFloat(String(tip.savings)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), tip.currency)}
              </span>
              !
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>
                {tip.direction === "origin" ? "Departing from" : "Flying to"}{" "}
                <span className="line-through">{tip.searchedName}</span>
              </span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span style={{ color: "hsl(145 65% 55%)" }} className="font-semibold">
                {tip.alternateName}
              </span>
              <span className="text-muted-foreground">
                ({formatCurrency(String((parseFloat(String(tip.searchedPrice)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), tip.currency)}
                {" → "}
                {formatCurrency(String((parseFloat(String(tip.alternatePrice)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), tip.currency)})
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
