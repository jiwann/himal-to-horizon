import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight, RefreshCw, Ban, Luggage, Backpack, CheckCircle2, TrendingDown, TrendingUp, ShieldCheck, Bell, BellOff, Zap, Clock3, CircleDot, X } from "lucide-react";
import { cn, formatCurrency, formatDuration, formatTime, formatDate, getStopsLabel, getTotalStops } from "@/lib/utils";
import { buildGoogleFlightsUrl, trackAffiliateClick } from "@/lib/affiliate";
import type { FlightOffer, FlightSlice } from "@shared/schema";
import type { PriceInsight } from "@/lib/price-history";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

// ── Segment helper functions ────────────────────────────────────────────────

/** Minutes of ground time between two segments */
function layoverMinutes(arrivalAt: string, nextDepartureAt: string): number {
  return Math.round((new Date(nextDepartureAt).getTime() - new Date(arrivalAt).getTime()) / 60000);
}

/** Human-readable layover label; flags > 4h as "Long layover" */
function formatLayoverLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const duration = m > 0 ? `${h}h ${m}m` : `${h}h`;
  return minutes > 4 * 60 ? `Long layover · ${duration}` : `${duration} layover`;
}

/** True when the arrival calendar date differs from the departure date (crosses midnight) */
function isNextDay(departureAt: string, arrivalAt: string): boolean {
  return departureAt.slice(0, 10) !== arrivalAt.slice(0, 10);
}

/** Returns a short date prefix (e.g., "Apr 6") when a segment departs on a different day than the slice */
function departureDatePrefix(sliceDeparture: string, segDeparture: string): string | null {
  if (sliceDeparture.slice(0, 10) !== segDeparture.slice(0, 10)) {
    return formatDate(segDeparture, "MMM d");
  }
  return null;
}

type HorizonInsight = {
  savingsPct: number;
  savings: number;
  currency: string;
  alternateDate: string;
};

type Props = {
  offer: FlightOffer;
  isCheapest?: boolean;
  index: number;
  isSelected?: boolean;
  onSelect?: (offer: FlightOffer) => void;
  priceInsight?: PriceInsight;
  isTracked?: boolean;
  onTrack?: (offer: FlightOffer) => void;
  horizonInsight?: HorizonInsight;
  onHorizonApply?: () => void;
  hasStayOptimizerDeal?: boolean;
  insightVerified?: boolean;
  tripType?: string;
};

export function FlightCard({ offer, isCheapest, index, isSelected, onSelect, priceInsight, isTracked, onTrack, horizonInsight, onHorizonApply, hasStayOptimizerDeal, insightVerified, tripType }: Props) {
  const isMultiCityOffer = tripType === "multi_city" || offer.slices.length > 2;
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  const totalStops = getTotalStops(offer.slices);
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];

  const canRefund = offer.conditions?.refund_before_departure?.allowed;
  const checkedBags = offer.checkedBags ?? 0;
  const carryOnBags = offer.carryOnBags ?? 0;
  const personalItemOnly = offer.personalItemOnly ?? false;

  return (
    <div
      data-testid={`flight-card-${index}`}
      className={cn(
        "glass-result-card rounded-md transition-all duration-200",
        isSelected
          ? "hover:border-white/20"
          : "hover:border-white/14"
      )}
      style={
        isSelected
          ? {
              border: "1px solid hsl(22 79% 75% / 0.55)",
              boxShadow: "0 0 0 1px hsl(22 79% 75% / 0.2), 0 0 20px hsl(22 79% 75% / 0.1)",
            }
          : undefined
      }
    >
      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isCheapest && !isSelected && !horizonInsight && (
            <Badge
              className="text-xs font-semibold"
              style={{
                background: "hsl(22 79% 75% / 0.15)",
                color: "hsl(22 79% 75%)",
                border: "1px solid hsl(22 79% 75% / 0.3)",
              }}
            >
              Best Value
            </Badge>
          )}
          {isSelected && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              style={{
                background: "hsl(145 65% 55% / 0.15)",
                color: "hsl(145 65% 55%)",
                border: "1px solid hsl(145 65% 55% / 0.35)",
              }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Selected
            </Badge>
          )}
          {priceInsight?.serverPrediction === "buy_now" && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              data-testid={`badge-buy-now-${index}`}
              style={{
                background: "hsl(145 65% 55% / 0.14)",
                color: "hsl(145 65% 62%)",
                border: "1px solid hsl(145 65% 55% / 0.4)",
              }}
            >
              <Zap className="h-3 w-3" />
              {t("prediction.buy_now_badge")}
            </Badge>
          )}
          {priceInsight?.serverPrediction === "wait" && !horizonInsight && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              data-testid={`badge-wait-${index}`}
              style={{
                background: "rgba(247,176,136,0.12)",
                color: "#F7B088",
                border: "1px solid rgba(247,176,136,0.35)",
              }}
            >
              <Clock3 className="h-3 w-3" />
              {t("prediction.wait_badge")}
            </Badge>
          )}
          {!priceInsight?.serverPrediction && priceInsight?.isBuyNow && !priceInsight?.isWait && !hasStayOptimizerDeal && !horizonInsight && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              data-testid={`badge-h2h-buy-now-${index}`}
              style={{
                background: "hsl(145 65% 55% / 0.12)",
                color: "hsl(145 65% 60%)",
                border: "1px solid hsl(145 65% 55% / 0.35)",
              }}
            >
              <ShieldCheck className="h-3 w-3" />
              {t("badge.horizon_verified_buy")}
            </Badge>
          )}
          {!priceInsight?.serverPrediction && !priceInsight?.isBuyNow && priceInsight?.isWait && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              data-testid={`badge-h2h-wait-${index}`}
              style={{
                background: "rgba(247,176,136,0.12)",
                color: "#F7B088",
                border: "1px solid rgba(247,176,136,0.35)",
              }}
            >
              <Clock3 className="h-3 w-3" />
              {t("badge.horizon_verified_wait")}
            </Badge>
          )}
          {!priceInsight?.serverPrediction && !priceInsight?.isBuyNow && !priceInsight?.isWait && (priceInsight?.serverDataPoints ?? 0) >= 3 && priceInsight?.serverAvgPrice && (
            <Badge
              className="text-xs font-semibold flex items-center gap-1"
              data-testid={`badge-fair-price-${index}`}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "hsl(var(--muted-foreground))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <CircleDot className="h-3 w-3" />
              Fair Price
            </Badge>
          )}
          {horizonInsight && horizonInsight.savingsPct >= 10 && onHorizonApply && (
            <button
              type="button"
              data-testid={`badge-better-horizon-${index}`}
              onClick={(e) => { e.stopPropagation(); onHorizonApply(); }}
              className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              title={`A cheaper flight on ${horizonInsight.alternateDate} saves you ${formatCurrency(String((horizonInsight.savings * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), horizonInsight.currency)}`}
              style={{
                background: "rgba(247,176,136,0.14)",
                color: "#F7B088",
                border: "1px solid rgba(247,176,136,0.4)",
              }}
            >
              <Clock3 className="h-3 w-3 shrink-0" />
              Wait: Better Horizon Found — Save {formatCurrency(String((horizonInsight.savings * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), horizonInsight.currency)}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {offer.owner.logo_symbol_url ? (
              <img
                src={offer.owner.logo_symbol_url}
                alt={offer.owner.name}
                className="w-12 h-12 shrink-0 rounded-lg object-contain"
                style={{ background: "#fff", padding: "5px" }}
              />
            ) : (
              <div className="w-12 h-12 airline-logo-placeholder shrink-0 text-[10px]">
                {offer.owner.iata_code}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
                {offer.owner.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <SlicePreview slice={outbound} label={isMultiCityOffer ? "Leg 1" : "Outbound"} />
            {inbound && (
              <>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <SlicePreview slice={inbound} label={isMultiCityOffer ? "Leg 2" : "Return"} />
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 ml-auto">
            {(() => {
              const baseTotal = parseFloat(offer.total_amount);
              const displayTotal = baseTotal * (1 + SERVICE_FEE_PERCENT);
              const pax = Math.max(offer.passengers_count || 1, 1);
              const displayPerPax = displayTotal / pax;
              return (
                <>
                  <div
                    className="text-2xl font-extrabold"
                    data-testid={`price-${index}`}
                    style={{ fontFamily: "var(--font-sans)", color: "hsl(var(--foreground))", opacity: 1 }}
                  >
                    {formatCurrency(String(displayPerPax), offer.total_currency)}
                  </div>
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 1 }}>
                    indicative · verify before booking
                  </div>
                  {pax > 1 && (
                    <div className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))", opacity: 1 }}>
                      Total: {formatCurrency(String(displayTotal), offer.total_currency)}
                    </div>
                  )}
                  {insightVerified && (
                    <div
                      className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                      data-testid={`verified-value-badge-${index}`}
                      style={{ background: "rgba(56,200,120,0.12)", color: "hsl(145 65% 58%)", border: "1px solid rgba(56,200,120,0.25)" }}
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      Verified Value
                    </div>
                  )}
                </>
              );
            })()}
            {priceInsight?.prediction && (() => {
              const predColor = priceInsight.prediction === "rise" ? "hsl(0 70% 60%)" : "hsl(145 65% 55%)";
              const currentPrice = parseFloat(offer.total_amount);
              const pct = priceInsight.predictionPct ?? 0;
              const dollarChange = pct > 0 ? Math.round(currentPrice * pct / 100) : 0;
              const projectedPrice = Math.round(currentPrice + (priceInsight.prediction === "rise" ? dollarChange : -dollarChange));
              const bookByDate = (() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              })();
              const currency = offer.total_currency ?? "USD";
              return (
                <div
                  className="flex flex-col gap-0.5 text-[11px] font-medium"
                  data-testid={`price-prediction-${index}`}
                >
                  <div className="flex items-center gap-1" style={{ color: predColor }}>
                    {priceInsight.prediction === "rise" ? (
                      <TrendingUp className="h-3 w-3 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 shrink-0" />
                    )}
                    Horizon&apos;s Prediction: likely to{" "}
                    <span className="font-bold capitalize">{priceInsight.prediction}</span>
                    {pct > 0 && <> ~{pct}%{dollarChange > 0 && <span className="opacity-80"> ({priceInsight.prediction === "rise" ? "+" : "−"}{formatCurrency(dollarChange, currency)})</span>}</>}
                  </div>
                  {pct > 0 && dollarChange > 0 && (
                    <div className="flex items-center gap-1 pl-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {priceInsight.prediction === "rise" ? (
                        <>If not booked by <span className="font-semibold" style={{ color: predColor }}>{bookByDate}</span>, price may reach <span className="font-semibold" style={{ color: predColor }}>{formatCurrency(projectedPrice, currency)}</span></>
                      ) : (
                        <>Price could drop to <span className="font-semibold" style={{ color: predColor }}>{formatCurrency(projectedPrice, currency)}</span> — consider waiting until <span className="font-semibold" style={{ color: predColor }}>{bookByDate}</span></>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center gap-1.5">
              {onTrack && (
                <button
                  type="button"
                  data-testid={`track-flight-${index}`}
                  onClick={(e) => { e.stopPropagation(); onTrack(offer); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap"
                  style={
                    isTracked
                      ? { background: "rgba(247,176,136,0.18)", color: "#F7B088", borderColor: "rgba(247,176,136,0.4)" }
                      : { background: "rgba(255,255,255,0.03)", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                  }
                >
                  {isTracked ? <Bell className="h-3 w-3 shrink-0" /> : <BellOff className="h-3 w-3 shrink-0" />}
                  <span>{isTracked ? "Tracking" : "Track this Flight"}</span>
                </button>
              )}
              {(() => {
                const _origin = offer.slices[0].origin.iata_code;
                const _dest = offer.slices[0].destination.iata_code;
                const _dep = offer.slices[0].departure_at?.slice(0, 10) ?? "";
                const _ret = offer.slices.length > 1 ? offer.slices[1].departure_at?.slice(0, 10) : undefined;
                return (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={buildGoogleFlightsUrl(_origin, _dest, _dep, _ret)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`book-google-${index}`}
                      onClick={() => trackAffiliateClick("flight_verify_google", { offerId: offer.id, origin: _origin, destination: _dest })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-150"
                      style={{ background: "hsl(22 79% 75%)", color: "hsl(211 60% 8%)", fontFamily: "var(--font-sans)", textDecoration: "none" }}
                    >
                      Google Flights
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Clock className="h-3 w-3" />
            {getStopsLabel(totalStops)}
          </div>

          {/* Carry-on status — always shown */}
          <div
            className="flex items-center gap-1 text-xs font-medium"
            data-testid={`bags-carryon-${index}`}
            style={{ color: carryOnBags > 0 ? "hsl(145 65% 55%)" : "hsl(0 65% 60%)" }}
          >
            {carryOnBags > 0
              ? <CheckCircle2 className="h-3 w-3 shrink-0" />
              : <X className="h-3 w-3 shrink-0" />}
            <span style={carryOnBags === 0 ? { textDecoration: "line-through", opacity: 0.8 } : {}}>
              Carry-on
            </span>
          </div>

          {/* Checked bag status — always shown */}
          <div
            className="flex items-center gap-1 text-xs font-medium"
            data-testid={`bags-checked-${index}`}
            style={{ color: checkedBags > 0 ? "hsl(var(--horizon-gold))" : "hsl(var(--muted-foreground))" }}
          >
            {checkedBags > 0
              ? <Luggage className="h-3 w-3 shrink-0" />
              : <X className="h-3 w-3 shrink-0" />}
            <span style={checkedBags === 0 ? { textDecoration: "line-through", opacity: 0.7 } : {}}>
              {checkedBags > 0 ? `${checkedBags} checked bag${checkedBags > 1 ? "s" : ""}` : "Checked bag"}
            </span>
          </div>

          {/* Bags Fly Through — single-ticket connecting flights with confirmed (non-estimated) baggage */}
          {totalStops > 0 && checkedBags > 0 && !offer.baggageEstimated && (
            <div
              className="flex items-center gap-1 text-xs font-medium"
              data-testid={`bags-fly-through-${index}`}
              style={{ color: "hsl(200 80% 60%)" }}
            >
              <Luggage className="h-3 w-3 shrink-0" />
              Bags fly through
            </div>
          )}

          {canRefund && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(145 65% 55%)" }}>
              <RefreshCw className="h-3 w-3" />
              Refundable
            </div>
          )}
          {canRefund === false && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Ban className="h-3 w-3" />
              Non-refundable
            </div>
          )}

          <button
            type="button"
            data-testid={`details-flight-${index}`}
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-xs font-semibold transition-opacity hover:opacity-100"
            style={{ color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer" }}
          >
            {expanded ? "▴ Less" : "▾ Details"}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {offer.slices.map((slice, si) => (
              <div key={slice.id}>
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}
                >
                  {isMultiCityOffer
                    ? `Leg ${si + 1}`
                    : si === 0 ? "Outbound" : "Return"
                  } · {formatDate(slice.departure_at)}
                </div>
                <div className="space-y-1.5">
                  {slice.segments.flatMap((seg, segIdx) => {
                    const prevSeg = segIdx > 0 ? slice.segments[segIdx - 1] : null;
                    const nextDayArrival = isNextDay(seg.departure_at, seg.arrival_at);
                    const datePfx = departureDatePrefix(slice.departure_at, seg.departure_at);
                    const layoverMins = prevSeg ? layoverMinutes(prevSeg.arrival_at, seg.departure_at) : null;
                    const isLongLayover = (layoverMins ?? 0) > 4 * 60;

                    const rows = [];

                    // Layover row before this segment (except first)
                    if (layoverMins !== null) {
                      rows.push(
                        <div
                          key={`layover-${segIdx}`}
                          className="flex items-center gap-1.5 py-1 pl-11 text-[11px]"
                          style={{ color: isLongLayover ? "hsl(42 90% 65%)" : "hsl(var(--muted-foreground))" }}
                        >
                          <Clock3 className="h-3 w-3 shrink-0" />
                          <span className={isLongLayover ? "font-semibold" : ""}>
                            {formatLayoverLabel(layoverMins)} in {seg.origin.iata_code}
                          </span>
                        </div>
                      );
                    }

                    // Segment row
                    rows.push(
                      <div key={seg.id} className="flex items-center gap-3 text-sm">
                        {seg.operating_carrier.logo_symbol_url ? (
                          <img
                            src={seg.operating_carrier.logo_symbol_url}
                            alt={seg.operating_carrier.name}
                            className="w-8 h-8 shrink-0 rounded object-contain"
                            style={{ background: "#fff", padding: "3px" }}
                          />
                        ) : (
                          <div className="w-8 h-8 airline-logo-placeholder text-[9px] shrink-0">
                            {seg.operating_carrier.iata_code}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{seg.origin.iata_code}</span>
                          {datePfx && (
                            <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: "hsl(22 79% 75% / 0.15)", color: "hsl(22 79% 72%)" }}>
                              {datePfx}
                            </span>
                          )}
                          <span style={{ color: "hsl(var(--muted-foreground))" }}>{formatTime(seg.departure_at)}</span>
                          <ArrowRight className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                          <span className="font-semibold text-foreground">{seg.destination.iata_code}</span>
                          <span style={{ color: "hsl(var(--muted-foreground))" }}>
                            {formatTime(seg.arrival_at)}
                            {nextDayArrival && (
                              <sup className="ml-0.5 text-[9px] font-bold" style={{ color: "hsl(42 90% 65%)" }}>+1</sup>
                            )}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(seg.duration)}
                          </Badge>
                          <span
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}
                          >
                            {seg.operating_carrier.name} · {seg.operating_carrier.iata_code}{seg.flight_number}
                          </span>
                        </div>
                      </div>
                    );

                    return rows;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlicePreview({ slice, label: _label }: { slice: FlightSlice; label: string }) {
  const totalDuration = formatDuration(slice.duration);
  const stops = slice.segments.length - 1 + slice.segments.reduce((s, seg) => s + seg.stops, 0);

  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          {formatTime(slice.departure_at)}
        </div>
        <div className="text-xs font-semibold tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
          {slice.origin.iata_code}
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
          {totalDuration}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-12 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          <Plane className="h-3 w-3 rotate-90" style={{ color: "hsl(22 79% 75%)" }} />
          <div className="w-12 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
          {getStopsLabel(stops)}
        </div>
        {stops > 0 && (
          <div className="text-[10px] font-semibold" style={{ color: "hsl(22 79% 75%)", fontFamily: "var(--font-sans)" }}>
            via {slice.segments.slice(0, -1).map(s => s.destination.iata_code).join(", ")}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          {formatTime(slice.arrival_at)}
        </div>
        <div className="text-xs font-semibold tracking-widest" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
          {slice.destination.iata_code}
        </div>
      </div>
    </div>
  );
}
