import { Sparkles, TrendingDown, ArrowRight, Loader2, CheckCircle2, X, Luggage, Backpack } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { HimalInsight as HimalInsightType } from "@shared/schema";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

type Props = {
  insight: HimalInsightType;
  onApply: (date: string) => void;
  isApplying?: boolean;
};

export function HimalInsight({ insight, onApply, isApplying }: Props) {
  return (
    <div
      data-testid="himal-insight-card"
      className="relative rounded-xl mb-6 overflow-hidden"
      style={{
        background: "rgba(247,176,136,0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(247,176,136,0.30)",
        boxShadow:
          "0 0 32px rgba(247,176,136,0.10), 0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Ambient glow strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(247,176,136,0.6) 40%, rgba(247,176,136,0.8) 60%, transparent 100%)",
        }}
      />

      {/* Subtle radial bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(247,176,136,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative px-5 py-4 flex items-start gap-4 flex-wrap">
        {/* Icon badge */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: "rgba(247,176,136,0.14)",
            border: "1px solid rgba(247,176,136,0.25)",
          }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "hsl(22 79% 75%)" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: "hsl(22 79% 75%)" }}
            >
              Horizon's Insight
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-sm font-bold"
              style={{
                background: "rgba(247,176,136,0.15)",
                color: "hsl(22 79% 75%)",
                border: "1px solid rgba(247,176,136,0.2)",
              }}
            >
              Save{" "}
              <span style={{ fontSize: "1.05em" }}>
                {insight.savingsPercent.toFixed(0)}%
              </span>
            </span>
          </div>

          {/* Main message */}
          <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-serif)" }}>
            Save{" "}
            <span
              className="font-extrabold"
              style={{ color: "hsl(22 79% 75%)" }}
            >
              {formatCurrency(String((parseFloat(String(insight.savings)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), insight.currency)}
            </span>{" "}
            by flying on{" "}
            <span className="font-bold">{formatDate(insight.alternateDate, "EEE, d MMM")}</span>
          </p>

          {/* Price comparison */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="line-through opacity-70">
              {formatCurrency(String((parseFloat(String(insight.originalPrice)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), insight.currency)} · {formatDate(insight.originalDate, "d MMM")}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="font-bold" style={{ color: "hsl(145 65% 55%)" }}>
              {formatCurrency(String((parseFloat(String(insight.alternatePrice)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), insight.currency)} · {formatDate(insight.alternateDate, "d MMM")}
            </span>
          </div>

          {/* Baggage info for the alternate date flight */}
          {(typeof insight.alternateCarryOnBags === "number" || typeof insight.alternateCheckedBags === "number") && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {typeof insight.alternateCarryOnBags === "number" && (
                <span
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: insight.alternateCarryOnBags > 0 ? "hsl(145 65% 55%)" : "hsl(0 65% 60%)" }}
                >
                  {insight.alternateCarryOnBags > 0
                    ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                    : <X className="h-3 w-3 shrink-0" />}
                  <span style={insight.alternateCarryOnBags === 0 ? { textDecoration: "line-through", opacity: 0.8 } : {}}>
                    Carry-on
                  </span>
                </span>
              )}
              {typeof insight.alternateCheckedBags === "number" && (
                <span
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: insight.alternateCheckedBags > 0 ? "hsl(42 90% 65%)" : "hsl(var(--muted-foreground))" }}
                >
                  {insight.alternateCheckedBags > 0
                    ? <Luggage className="h-3 w-3 shrink-0" />
                    : <X className="h-3 w-3 shrink-0" />}
                  <span style={insight.alternateCheckedBags === 0 ? { textDecoration: "line-through", opacity: 0.7 } : {}}>
                    {insight.alternateCheckedBags > 0
                      ? `${insight.alternateCheckedBags} checked bag${insight.alternateCheckedBags > 1 ? "s" : ""}`
                      : "Checked bag"}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Applying feedback */}
          {isApplying && (
            <div className="flex items-center gap-2 mt-2 text-xs font-medium" style={{ color: "hsl(22 79% 75%)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Applying Horizon's suggested dates…
            </div>
          )}
        </div>

        {/* Apply button — pulsing when not applying */}
        <button
          type="button"
          data-testid="apply-insight"
          disabled={isApplying}
          onClick={() => onApply(insight.alternateDate)}
          className={`shrink-0 px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${isApplying ? "opacity-60 cursor-not-allowed" : "horizon-insight-pulse"}`}
          style={{
            background: "hsl(22 79% 75%)",
            color: "hsl(211 60% 8%)",
            boxShadow: isApplying
              ? "none"
              : "0 0 16px rgba(247,176,136,0.4), 0 2px 8px rgba(0,0,0,0.3)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {isApplying ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Applying…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Apply Date
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
