import { Sparkles, TrendingDown, Loader2, Luggage, ShoppingBag, ArrowRight, Shield } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { trackAffiliateClick } from "@/lib/affiliate";
import type { GoldenOpportunity } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

type Props = {
  opportunity: GoldenOpportunity;
  onApply: (departureDate: string, returnDate?: string) => void;
  onSecureHorizon?: (departureDate: string, returnDate?: string) => void;
  isApplying?: boolean;
  origin?: string;
  destination?: string;
  adults?: number;
};

export function GoldenOpportunityCard({ opportunity, onApply, onSecureHorizon, isApplying, origin, destination, adults = 1 }: Props) {
  const { t, isRtl } = useLanguage();
  const dayCount = Math.abs(opportunity.dayOffset);
  const dayUnit = dayCount === 1 ? t("golden.day") : t("golden.days");
  const direction = opportunity.dayOffset < 0 ? t("golden.direction_earlier") : t("golden.direction_later");

  const hasReturn = !!opportunity.alternateReturnDate;

  const currentWithFee = opportunity.currentPrice * (1 + SERVICE_FEE_PERCENT);
  const alternateWithFee = opportunity.alternatePrice * (1 + SERVICE_FEE_PERCENT);
  const savingsWithFee = currentWithFee - alternateWithFee;

  const canBookOnHorizon = !!onSecureHorizon;

  return (
    <div
      className="relative rounded-xl mb-6 overflow-hidden"
      data-testid="golden-opportunity-card"
      style={{
        background: "rgba(247,176,136,0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(247,176,136,0.30)",
        boxShadow: "0 0 32px rgba(247,176,136,0.10), 0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Top ambient glow strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(247,176,136,0.6) 40%, rgba(247,176,136,0.8) 60%, transparent 100%)",
        }}
      />

      {/* Corner radial bloom — mirrors in RTL */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isRtl
            ? "radial-gradient(ellipse at 80% 50%, rgba(247,176,136,0.08) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 20% 50%, rgba(247,176,136,0.08) 0%, transparent 60%)",
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
          <Sparkles className="h-5 w-5" style={{ color: "#F7B088" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: "#F7B088" }}
            >
              {t("golden.title")}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              data-testid="scan-badge"
              style={{
                background: "rgba(247,176,136,0.14)",
                color: "#F7B088",
                border: "1px solid rgba(247,176,136,0.25)",
              }}
            >
              {t("golden.scan_label")}
            </span>
            {canBookOnHorizon && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  color: "hsl(145 65% 55%)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <Shield className="h-2.5 w-2.5" />
                Horizon's Booking Recommendations
              </span>
            )}
          </div>

          {/* Main sentence */}
          <p
            className="text-sm font-semibold text-foreground leading-snug mb-1 flex items-baseline gap-1 flex-wrap"
            data-testid="golden-insight-message"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 self-center" style={{ color: "#F7B088" }} />
            Horizon&apos;s Insight: Save{" "}
            <span className="font-extrabold" style={{ color: "#F7B088" }}>
              {formatCurrency(savingsWithFee, opportunity.currency)}
            </span>{" "}
            by shifting your trip to{" "}
            <span className="font-extrabold" style={{ color: "#F7B088" }}>
              {formatDate(opportunity.alternateDepartureDate, "d MMM yyyy")}
              {hasReturn && <> &mdash; {formatDate(opportunity.alternateReturnDate!, "d MMM yyyy")}</>}
            </span>.
          </p>

          {/* Full trip date range — always shown with "New Trip:" label */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold mb-1"
            data-testid="golden-insight-dates"
            style={{ background: "rgba(247,176,136,0.12)", color: "#F7B088", border: "1px solid rgba(247,176,136,0.25)" }}
          >
            <span style={{ opacity: 0.75, fontWeight: 400 }}>New Trip:</span>
            {formatDate(opportunity.alternateDepartureDate, "d MMM yyyy")}
            {hasReturn && (
              <> &mdash; {formatDate(opportunity.alternateReturnDate!, "d MMM yyyy")}</>
            )}
          </div>

          {/* Price comparison — include 3% fee */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="line-through opacity-70">
              {formatCurrency(currentWithFee, opportunity.currency)}
            </span>
            <span>→</span>
            <span className="font-bold" style={{ color: "hsl(145 65% 55%)" }}>
              {formatCurrency(alternateWithFee, opportunity.currency)}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: "rgba(247,176,136,0.15)", color: "#F7B088" }}
            >
              -{Math.round(opportunity.savingsPercent)}%
            </span>
            <span className="opacity-50 text-[10px]">incl. 3% fee</span>
          </div>

          {/* Baggage & airline info */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {opportunity.airlineName && (
              <span className="text-[11px] text-muted-foreground font-medium">
                {opportunity.airlineName}
              </span>
            )}
            {typeof opportunity.alternateCarryOnBags === "number" && (
              <span
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: opportunity.alternateCarryOnBags > 0 ? "hsl(145 65% 55%)" : "hsl(0 65% 60%)" }}
              >
                <ShoppingBag className="h-3 w-3" />
                <span style={opportunity.alternateCarryOnBags === 0 ? { textDecoration: "line-through", opacity: 0.8 } : {}}>
                  Carry-on
                </span>
              </span>
            )}
            {typeof opportunity.alternateCheckedBags === "number" && (
              <span
                className="flex items-center gap-1 text-[11px] font-semibold"
                title={`${opportunity.alternateCheckedBags > 0 ? opportunity.alternateCheckedBags + " checked bag(s) included" : "No checked bags"}`}
                style={{ color: opportunity.alternateCheckedBags > 0 ? "hsl(42 90% 65%)" : "hsl(var(--muted-foreground))" }}
              >
                <Luggage className="h-3 w-3" />
                <span style={opportunity.alternateCheckedBags === 0 ? { textDecoration: "line-through", opacity: 0.7 } : {}}>
                  {opportunity.alternateCheckedBags > 0
                    ? `${opportunity.alternateCheckedBags} checked bag${opportunity.alternateCheckedBags > 1 ? "s" : ""}`
                    : "Checked bag"}
                </span>
              </span>
            )}
          </div>

          {/* Applying feedback */}
          {isApplying && (
            <div
              className="flex items-center gap-2 mt-2 text-xs font-medium"
              style={{ color: "#F7B088" }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("golden.applying")}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* Primary: Apply dates button */}
          <button
            type="button"
            data-testid="apply-golden-opportunity"
            disabled={isApplying}
            onClick={() => onApply(opportunity.alternateDepartureDate, opportunity.alternateReturnDate)}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              isApplying ? "opacity-60 cursor-not-allowed" : "horizon-insight-pulse"
            }`}
            style={{
              background: "#F7B088",
              color: "hsl(211 60% 8%)",
              fontFamily: "var(--font-sans)",
              opacity: 1,
              boxShadow: isApplying
                ? "none"
                : "0 0 16px rgba(247,176,136,0.4), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5" />
                {t("golden.apply_button")}
              </>
            )}
          </button>

          {/* Secondary: Secure This Horizon (internal) OR external affiliate */}
          {canBookOnHorizon ? (
            <button
              type="button"
              data-testid="secure-this-horizon-insight"
              disabled={isApplying}
              onClick={() => {
                trackAffiliateClick("insight_secure_horizon", {
                  origin,
                  destination,
                  alternateDate: opportunity.alternateDepartureDate,
                });
                onSecureHorizon!(opportunity.alternateDepartureDate, opportunity.alternateReturnDate);
              }}
              className="px-4 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150"
              style={{
                background: "rgba(34,197,94,0.10)",
                color: "hsl(145 65% 55%)",
                border: "1px solid rgba(34,197,94,0.25)",
                fontFamily: "var(--font-sans)",
                opacity: 1,
              }}
            >
              <Shield className="h-3 w-3" />
              View Deals
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : origin && destination ? (
            <a
              href={`https://tp.media/r?marker=504117&p=4003&u=${encodeURIComponent(
                `https://www.trip.com/flights/${origin.toLowerCase()}-${destination.toLowerCase()}/?dcity=${origin}&acity=${destination}&ddate=${opportunity.alternateDepartureDate}${opportunity.alternateReturnDate ? `&rdate=${opportunity.alternateReturnDate}` : ""}&flighttype=${opportunity.alternateReturnDate ? "rt" : "ow"}&cabin=y&adult=${adults}&child=0&infant=0`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="book-alternate-dates"
              onClick={() => trackAffiliateClick("insight_book_click", { origin, destination, alternateDate: opportunity.alternateDepartureDate })}
              className="px-4 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150"
              style={{
                background: "rgba(247,176,136,0.12)",
                color: "#F7B088",
                border: "1px solid rgba(247,176,136,0.3)",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                opacity: 1,
              }}
            >
              Compare externally
              <ArrowRight className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
