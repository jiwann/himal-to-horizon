import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { CalendarDay, WideInsightPricePoint } from "@shared/schema";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";

type Props = {
  origin: string;
  destination: string;
  cabinClass: string;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  externalPriceMap?: WideInsightPricePoint[];
  dotsLoading?: boolean;
};

export function PriceCalendar({ origin, destination, cabinClass, onSelectDate, selectedDate, externalPriceMap, dotsLoading }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return selectedDate.substring(0, 7);
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM");
  });

  const { data, isLoading } = useQuery<{ days: CalendarDay[] }>({
    queryKey: ["/api/flights/calendar", origin, destination, viewMonth, cabinClass],
    enabled: !!(origin && destination),
    queryFn: async () => {
      const params = new URLSearchParams({
        origin,
        destination,
        month: viewMonth,
        cabinClass,
        adults: "1",
        children: "0",
        infants: "0",
      });
      const res = await fetch(`/api/flights/calendar?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const days = data?.days ?? [];

  const combined = new Map<string, { price: number; currency: string; available: boolean }>();
  if (externalPriceMap && externalPriceMap.length > 0) {
    for (const pt of externalPriceMap) {
      combined.set(pt.date, { price: pt.price, currency: pt.currency, available: true });
    }
  }
  for (const d of days) {
    if (d.price && !combined.has(d.date)) {
      combined.set(d.date, { price: d.price, currency: d.currency ?? "USD", available: !!d.available });
    }
  }

  const priceMap = combined;
  const allPrices = Array.from(combined.values()).map(v => v.price).sort((a, b) => a - b);
  const p25 = allPrices.length > 0 ? allPrices[Math.floor(allPrices.length * 0.25)] : 0;
  const p75 = allPrices.length > 0 ? allPrices[Math.floor(allPrices.length * 0.75)] : 0;

  function getDotColor(price: number): string {
    if (price <= p25) return "hsl(145 65% 55%)";
    if (price <= p75) return "hsl(22 79% 75%)";
    return "hsl(0 70% 65%)";
  }

  function getPriceClass(price: number) {
    if (price <= p25) return "price-low";
    if (price <= p75) return "price-mid";
    return "price-high";
  }

  const monthStart = startOfMonth(parseISO(`${viewMonth}-01`));
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  function prevMonth() {
    const d = parseISO(`${viewMonth}-01`);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(format(d, "yyyy-MM"));
  }

  function nextMonth() {
    const d = parseISO(`${viewMonth}-01`);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(format(d, "yyyy-MM"));
  }

  return (
    <div data-testid="price-calendar" className="bg-card rounded-md border border-card-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">Price Calendar</h3>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="cal-prev">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-24 text-center">
            {format(parseISO(`${viewMonth}-01`), "MMMM yyyy")}
          </span>
          <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="cal-next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && combined.size === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading prices...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const calDay = priceMap.get(dateStr);
              const isSelected = dateStr === selectedDate;
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={dateStr}
                  type="button"
                  data-testid={`cal-day-${dateStr}`}
                  disabled={isPast || !calDay?.available}
                  onClick={() => calDay?.available && onSelectDate(dateStr)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md py-1.5 px-0.5 text-center transition-colors min-h-12",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && calDay?.available && "hover-elevate cursor-pointer",
                    !isSelected && !calDay?.available && isPast && "opacity-30 cursor-not-allowed",
                    !isSelected && !calDay?.available && !isPast && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <span className={cn("text-xs font-medium", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {format(day, "d")}
                  </span>
                  {calDay?.price && (
                    <>
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mt-0.5 mb-0.5"
                        style={{ background: isSelected ? "white" : getDotColor(calDay.price) }}
                      />
                      <span className={cn("text-[9px] font-semibold leading-tight",
                        isSelected ? "text-primary-foreground" : getPriceClass(calDay.price)
                      )}>
                        {formatCurrency(String((parseFloat(String(calDay.price)) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), calDay.currency ?? "USD")}
                      </span>
                    </>
                  )}
                  {!calDay?.price && !isPast && (
                    <span className="text-[9px] text-muted-foreground/40">—</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 flex-wrap">
            {dotsLoading && combined.size === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching price data…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Cheapest
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Moderate
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Expensive
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
