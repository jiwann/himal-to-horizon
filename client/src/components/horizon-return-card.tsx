import { Button } from "@/components/ui/button";
import { Plane, ArrowRight, RefreshCw, Ban, Luggage, ShoppingBag, Info, Star, CheckCircle2, Clock3 } from "lucide-react";
import { formatCurrency, formatDuration, formatTime, formatDate, getStopsLabel, totalTravelMinutes } from "@/lib/utils";
import { generateFlightBookingLink, trackAffiliateClick } from "@/lib/affiliate";
import type { FlightOffer, FlightSlice } from "@shared/schema";
import { useState } from "react";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

// ── Segment helper functions ────────────────────────────────────────────────

function layoverMinutes(arrivalAt: string, nextDepartureAt: string): number {
  return Math.round((new Date(nextDepartureAt).getTime() - new Date(arrivalAt).getTime()) / 60000);
}

function formatLayoverLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const duration = m > 0 ? `${h}h ${m}m` : `${h}h`;
  return minutes > 4 * 60 ? `Long layover · ${duration}` : `${duration} layover`;
}

function isNextDay(departureAt: string, arrivalAt: string): boolean {
  return departureAt.slice(0, 10) !== arrivalAt.slice(0, 10);
}

function departureDatePrefix(sliceDeparture: string, segDeparture: string): string | null {
  if (sliceDeparture.slice(0, 10) !== segDeparture.slice(0, 10)) {
    return formatDate(segDeparture, "MMM d");
  }
  return null;
}

type Props = {
  offer: FlightOffer;
  index: number;
  daysAtDestination: number;
  isBestValue?: boolean;
  isSelected?: boolean;
  returnDate?: string;
  originalSearchPrice?: number;
  originalSearchCurrency?: string;
  onSelect?: (offer: FlightOffer) => void;
  onSecureHorizon?: (offer: FlightOffer) => void;
};

export function daysAtDest(offer: FlightOffer): number {
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  if (!inbound) return 0;
  const arrivalMs = new Date(outbound.arrival_at).getTime();
  const departureMs = new Date(inbound.departure_at).getTime();
  return Math.max(0, Math.floor((departureMs - arrivalMs) / (1000 * 60 * 60 * 24)));
}

export function offerTotalMinutes(offer: FlightOffer): number {
  return totalTravelMinutes(offer.slices);
}

export function HorizonReturnCard({ offer, index, daysAtDestination, isBestValue, isSelected, returnDate, originalSearchPrice, originalSearchCurrency, onSelect, onSecureHorizon }: Props) {
  const [expanded, setExpanded] = useState(false);

  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  const destinationCity = outbound.destination.city_name || outbound.destination.iata_code;
  const checkedBags = offer.checkedBags ?? 0;
  const carryOnBags = offer.carryOnBags ?? 0;
  const canRefund = offer.conditions?.refund_before_departure?.allowed;
  const totalStops = offer.slices.reduce(
    (sum, s) => sum + s.segments.length - 1 + s.segments.reduce((ss, seg) => ss + seg.stops, 0),
    0
  );

  const daysColor =
    daysAtDestination >= 60
      ? "hsl(145 65% 55%)"
      : daysAtDestination >= 45
      ? "hsl(22 79% 75%)"
      : daysAtDestination >= 30
      ? "hsl(42 90% 60%)"
      : "hsl(176 24% 62%)";

  const displayReturnDate = returnDate
    ? returnDate
    : inbound?.departure_at
    ? inbound.departure_at.slice(0, 10)
    : null;

  return (
    <div
      data-testid={`horizon-return-card-${index}`}
      className="rounded-md overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: isSelected
          ? "1px solid hsl(145 65% 55% / 0.55)"
          : isBestValue
          ? "1px solid hsl(42 90% 55% / 0.5)"
          : "1px solid rgba(247,176,136,0.18)",
        boxShadow: isSelected
          ? "0 0 0 1px hsl(145 65% 55% / 0.2), 0 0 20px hsl(145 65% 55% / 0.1)"
          : isBestValue
          ? "0 0 24px hsl(42 90% 55% / 0.15), 0 4px 16px rgba(0,0,0,0.3)"
          : "0 0 20px rgba(247,176,136,0.06), 0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Best Value or Selected banner */}
      {(isBestValue || isSelected) && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase tracking-wider"
          style={
            isSelected
              ? {
                  background: "hsl(145 65% 55% / 0.12)",
                  borderBottom: "1px solid hsl(145 65% 55% / 0.25)",
                  color: "hsl(145 65% 55%)",
                }
              : {
                  background: "hsl(42 90% 52% / 0.18)",
                  borderBottom: "1px solid hsl(42 90% 52% / 0.3)",
                  color: "hsl(42 90% 60%)",
                }
          }
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Flight Selected
              <CheckCircle2 className="h-3 w-3" />
            </>
          ) : (
            <>
              <Star className="h-3 w-3 fill-current" />
              Best Value across all dates
              <Star className="h-3 w-3 fill-current" />
            </>
          )}
        </div>
      )}

      {/* Hero: days at destination */}
      <div
        className="px-6 py-5 text-center relative"
        style={{ borderBottom: "1px solid rgba(247,176,136,0.12)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, hsl(22 79% 75% / 0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="text-5xl font-extrabold leading-none mb-1"
          data-testid={`horizon-return-days-${index}`}
          style={{ fontFamily: "var(--font-sans)", color: daysColor }}
        >
          {daysAtDestination}
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: daysColor, opacity: 0.8 }}
        >
          Days at Destination
        </div>
        <div className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          in {destinationCity}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatDate(outbound.arrival_at, "d MMM")}
          {displayReturnDate && ` → ${formatDate(displayReturnDate, "d MMM yyyy")}`}
        </div>
      </div>

      {/* Flight timeline */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <FlightRow label="Outbound" slice={outbound} direction="outbound" />
        {inbound && <FlightRow label="Return" slice={inbound} direction="inbound" />}
      </div>

      {/* Bottom bar */}
      <div
        className="px-4 pb-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-medium text-muted-foreground">{offer.owner.name}</div>
          <div className="text-xs text-muted-foreground">{getStopsLabel(totalStops)}</div>
          {carryOnBags > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(145 65% 55%)" }}>
              <ShoppingBag className="h-3 w-3" />
              Carry-on incl.
            </div>
          )}
          {checkedBags > 0 && (
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "hsl(var(--horizon-gold))" }}
            >
              <Luggage className="h-3 w-3" />
              {checkedBags} bag{checkedBags > 1 ? "s" : ""} incl.
            </div>
          )}
          {canRefund && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(145 65% 55%)" }}>
              <RefreshCw className="h-3 w-3" />
              Refundable
            </div>
          )}
          {canRefund === false && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Ban className="h-3 w-3" />
              Non-refundable
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <div
              className="text-xl font-extrabold text-foreground"
              data-testid={`horizon-return-price-${index}`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {formatCurrency(String((parseFloat(offer.total_amount) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), offer.total_currency)}
            </div>
            {(offer.passengers_count ?? 1) > 1 ? (
              <>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(
                    String((parseFloat(offer.total_amount) * (1 + SERVICE_FEE_PERCENT) / (offer.passengers_count ?? 1)).toFixed(2)),
                    offer.total_currency
                  )}{" "}
                  / person
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">all taxes incl.</div>
            )}
            {(() => {
              if (!originalSearchPrice) return null;
              const thisPrice = parseFloat(offer.total_amount);
              const savings = originalSearchPrice - thisPrice;
              if (savings <= 5) return null;
              return (
                <div
                  className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  data-testid={`horizon-return-savings-${index}`}
                  style={{ background: "hsl(142 60% 35% / 0.18)", color: "hsl(142 60% 60%)", border: "1px solid hsl(142 60% 45% / 0.28)" }}
                >
                  ↓ Save {formatCurrency(String((savings * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), originalSearchCurrency ?? offer.total_currency)} vs your dates
                </div>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            data-testid={`horizon-return-expand-${index}`}
            style={{ color: "hsl(22 79% 75%)" }}
          >
            <Info className="h-4 w-4" />
          </button>
          {onSecureHorizon ? (
            <Button
              size="sm"
              data-testid={`horizon-return-secure-${index}`}
              onClick={() => onSecureHorizon(offer)}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                background: "hsl(22 79% 75%)",
                color: "hsl(211 60% 8%)",
                border: "none",
              }}
            >
              View Deals
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            /* Standard view — affiliate Book link + Select */
            <>
              <a
                href={generateFlightBookingLink(
                  offer.slices[0].origin.iata_code,
                  offer.slices[offer.slices.length - 1].destination.iata_code,
                  offer.slices[0].departure_at.slice(0, 10),
                  offer.slices.length > 1 ? offer.slices[1].departure_at.slice(0, 10) : undefined,
                  offer.passengers_count ?? 1,
                )}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`horizon-return-book-${index}`}
                onClick={() => trackAffiliateClick("horizon_return_book_click", { offerId: offer.id })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold"
                style={{ background: "hsl(22 79% 75%)", color: "hsl(211 60% 8%)", fontFamily: "var(--font-sans)", textDecoration: "none" }}
              >
                Book
                <ArrowRight className="h-3 w-3" />
              </a>
              <Button
                size="sm"
                variant="outline"
                data-testid={`horizon-return-select-${index}`}
                onClick={() => onSelect?.(offer)}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.15)",
                  ...(isSelected ? { background: "hsl(145 65% 40%)", color: "#fff", borderColor: "transparent" } : {}),
                }}
              >
                {isSelected ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selected
                  </span>
                ) : (
                  "Select"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-3 space-y-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {offer.slices.map((slice, si) => (
            <div key={slice.id}>
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {si === 0 ? "Outbound" : "Return"} · {formatDate(slice.departure_at)}
              </div>
              <div className="space-y-1.5">
                {slice.segments.flatMap((seg, segIdx) => {
                  const prevSeg = segIdx > 0 ? slice.segments[segIdx - 1] : null;
                  const nextDayArrival = isNextDay(seg.departure_at, seg.arrival_at);
                  const datePfx = departureDatePrefix(slice.departure_at, seg.departure_at);
                  const layoverMins = prevSeg ? layoverMinutes(prevSeg.arrival_at, seg.departure_at) : null;
                  const isLongLayover = (layoverMins ?? 0) > 4 * 60;

                  const rows = [];

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

                  rows.push(
                    <div key={seg.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 airline-logo-placeholder text-[9px] shrink-0">
                        {seg.operating_carrier.iata_code}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-foreground">{seg.origin.iata_code}</span>
                        {datePfx && (
                          <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: "hsl(22 79% 75% / 0.15)", color: "hsl(22 79% 72%)" }}>
                            {datePfx}
                          </span>
                        )}
                        <span className="text-muted-foreground">{formatTime(seg.departure_at)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{seg.destination.iata_code}</span>
                        <span className="text-muted-foreground">
                          {formatTime(seg.arrival_at)}
                          {nextDayArrival && (
                            <sup className="ml-0.5 text-[9px] font-bold" style={{ color: "hsl(42 90% 65%)" }}>+1</sup>
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDuration(seg.duration)} · {seg.operating_carrier.name}{" "}
                          {seg.operating_carrier.iata_code}
                          {seg.flight_number}
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
  );
}

function FlightRow({
  label,
  slice,
  direction,
}: {
  label: string;
  slice: FlightSlice;
  direction: "outbound" | "inbound";
}) {
  const stops =
    slice.segments.length -
    1 +
    slice.segments.reduce((s, seg) => s + seg.stops, 0);

  return (
    <div className="flex items-center gap-3">
      <div
        className="text-xs font-medium w-16 shrink-0"
        style={{ color: "hsl(22 79% 75%)", fontFamily: "var(--font-sans)" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold text-foreground w-11 shrink-0"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {formatTime(slice.departure_at)}
      </div>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground shrink-0">{slice.origin.iata_code}</span>
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <Plane
            className="h-3 w-3 shrink-0"
            style={{
              color: "hsl(22 79% 75%)",
              transform: direction === "inbound" ? "rotate(270deg)" : "rotate(90deg)",
            }}
          />
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{slice.destination.iata_code}</span>
      </div>
      <div
        className="text-sm font-bold text-foreground w-11 text-right shrink-0"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {formatTime(slice.arrival_at)}
      </div>
      <div className="text-xs text-muted-foreground w-14 text-right shrink-0">
        {stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
