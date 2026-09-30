import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plane, CalendarDays, List, ArrowLeft, Loader2,
  Clock, TrendingDown, ArrowRight, CheckCircle2,
  X, Info, MountainSnow,
  Bell, BellOff, User,
} from "lucide-react";
import logoImg from "@assets/logo_1772143671966.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlightSearchForm } from "@/components/flight-search-form";
import { FlightCard } from "@/components/flight-card";
import { offerTotalMinutes } from "@/components/horizon-return-card";
import { PriceCalendar } from "@/components/price-calendar";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency, getTotalStops } from "@/lib/utils";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";
import { markInsight, saveSearch } from "@/lib/search-history";
import { recordPrice, getPriceInsight } from "@/lib/price-history";
import { sessionGet, sessionSet, buildCacheKey } from "@/lib/session-cache";
import { PriceSparkline } from "@/components/price-sparkline";
import { trackAffiliateClick, buildGoogleFlightsUrl, buildKiwiUrl } from "@/lib/affiliate";
import { safePartnerOpen } from "@/lib/verify-status";
import type { FlightSearchInput, FlightSearchResult, FlightOffer } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { setSEO, resetSEO } from "@/lib/seo";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useToast } from "@/hooks/use-toast";

type RouteStats = {
  avgPrice: number | null;
  minPrice: number | null;
  dataPoints: number;
  prediction: "buy_now" | "wait" | null;
  trend: { date: string; avgPrice: number }[];
};



function stripAirportName(name: string): string {
  return name
    .replace(/\s+International\s+Airport\s*/gi, "")
    .replace(/\s+Airport\s*/gi, "")
    .replace(/\s+International\s*/gi, "")
    .trim();
}

function parseSearchParams(search: string): FlightSearchInput & {
  urlView?: "list" | "calendar";
  insightFilter?: boolean;
  noScans?: boolean;
} {
  const params = new URLSearchParams(search);
  const tripType = (params.get("tripType") as FlightSearchInput["tripType"]) ?? "round_trip";
  const segmentsRaw = params.get("segments");
  let segments: FlightSearchInput["segments"] | undefined;
  if (segmentsRaw) {
    try { segments = JSON.parse(segmentsRaw); } catch {}
  }
  return {
    origin: params.get("origin") ?? "",
    destination: params.get("destination") ?? "",
    departureDate: params.get("departureDate") ?? "",
    returnDate: params.get("returnDate") ?? undefined,
    passengers: {
      adults: parseInt(params.get("adults") ?? "1"),
      children: parseInt(params.get("children") ?? "0"),
      infants: parseInt(params.get("infants") ?? "0"),
    },
    cabinClass: (params.get("cabinClass") as FlightSearchInput["cabinClass"]) ?? "economy",
    tripType,
    includeNearbyAirports: params.get("includeNearbyAirports") === "true",
    directOnly: params.get("directOnly") === "true",
    urlView: (params.get("view") as "list" | "calendar") ?? undefined,
    insightFilter: params.get("insightFilter") === "true",
    currency: (params.get("currency") as FlightSearchInput["currency"]) ?? "USD",
    segments,
    noScans: params.get("noscans") === "1",
  };
}

function buildQueryString(data: FlightSearchInput & { tripType?: string; currency?: string }): string {
  const p = new URLSearchParams({
    origin: data.origin,
    destination: data.destination,
    departureDate: data.departureDate,
    ...(data.returnDate ? { returnDate: data.returnDate } : {}),
    adults: String(data.passengers.adults),
    children: String(data.passengers.children),
    infants: String(data.passengers.infants),
    cabinClass: data.cabinClass,
    tripType: data.tripType ?? "round_trip",
    includeNearbyAirports: String(data.includeNearbyAirports ?? false),
    currency: data.currency ?? "USD",
  });
  if (data.tripType === "multi_city" && data.segments?.length) {
    p.set("segments", JSON.stringify(data.segments));
  }
  return p.toString();
}


// ── LivePricesPanel ────────────────────────────────────────────────────────────
// Skyscanner-style provider comparison panel.
// Add new providers here when future affiliates / APIs are integrated.
interface LivePricesPanelProps {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currency: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

function LivePricesPanel({ origin, destination, departureDate, returnDate, adults = 1, children = 0, infants = 0, cabinClass = "economy" }: LivePricesPanelProps) {
  const googleUrl = buildGoogleFlightsUrl(origin, destination, departureDate, returnDate);

  type ProviderRow = {
    key: string;
    name: string;
    color: string;
    price: string | null;
    loading: boolean;
    href: string;
    rel: string;
    label: string;
    testId: string;
    trackKey: string;
  };

  const providers: ProviderRow[] = [
    {
      key: "google",
      name: "Google Flights",
      color: "#4285F4",
      price: null,
      loading: false,
      href: googleUrl,
      rel: "noopener noreferrer",
      label: "Search →",
      testId: "live-prices-google",
      trackKey: "live_panel_google",
    },
    {
      key: "kiwi",
      name: "Kiwi.com",
      color: "#FF6B35",
      price: null,
      loading: false,
      href: buildKiwiUrl(origin, destination, departureDate, returnDate, adults, children, infants, cabinClass),
      rel: "noopener noreferrer sponsored",
      label: "Search →",
      testId: "live-prices-kiwi",
      trackKey: "live_panel_kiwi",
    },
    // ── Add future providers here ──────────────────────────────────────────────
    // { key: "expedia", name: "Expedia", color: "#003580", price: null, ... },
    // { key: "skiplagged", name: "Skiplagged", color: "#7B2FBE", price: null, ... },
  ];

  return (
    <div
      data-testid="live-prices-panel"
      className="w-full max-w-md mx-auto rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
    >
      <div
        className="px-4 py-2.5 text-xs font-semibold tracking-wide uppercase"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
      >
        Check live fares
      </div>
      {providers.map((p, idx) => (
        <a
          key={p.key}
          href={p.href}
          target="_blank"
          rel={p.rel}
          data-testid={p.testId}
          onClick={() => trackAffiliateClick(p.trackKey, { origin, destination, departureDate })}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 group"
          style={{
            textDecoration: "none",
            borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Colour dot as provider logo placeholder */}
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          {/* Provider name */}
          <span className="flex-1 text-sm font-medium text-left" style={{ color: "hsl(var(--foreground))" }}>
            {p.name}
          </span>
          {/* Price */}
          <span className="text-sm font-bold tabular-nums" style={{ color: p.price ? "hsl(22 79% 75%)" : "hsl(var(--muted-foreground))" }}>
            {p.loading ? (
              <span className="inline-block h-3 w-12 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.1)" }} />
            ) : p.price ?? "—"}
          </span>
          {/* CTA */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors group-hover:opacity-90"
            style={{
              background: p.price ? "hsl(22 79% 75%)" : "rgba(255,255,255,0.08)",
              color: p.price ? "hsl(211 60% 8%)" : "hsl(var(--foreground))",
            }}
          >
            {p.label}
          </span>
        </a>
      ))}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();

  // useSearch() from wouter v3 returns the reactive query string — it re-renders this
  // component whenever the URL search params change, unlike window.location.search
  const search = useSearch(); // reactive query string from wouter (no leading "?")
  const initialParams = parseSearchParams(search);
  const [view, setView] = useState<"list" | "calendar">(initialParams.urlView ?? "list");
  const [sortOrder, setSortOrder] = useState<"best_value" | "shortest_journey">("best_value");
  const [stopsFilter, setStopsFilter] = useState<"any" | "nonstop" | "one" | "two_plus">("any");
  const [showSearch, setShowSearch] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [trackingAlert, setTrackingAlert] = useState(false);
  const [trackedOfferIds, setTrackedOfferIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const qcAlerts = useQueryClient();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const params = initialParams;
  const insightFilter = initialParams.insightFilter ?? false;

  useEffect(() => {
    const origin = params.origin || "";
    const dest = params.destination || "";
    setSEO({
      title: origin && dest ? `Flights from ${origin} to ${dest}` : "Flight Search Results",
      description: origin && dest
        ? `Compare flight prices from ${origin} to ${dest}. Find the cheapest fares across multiple airlines — no booking fees.`
        : "Compare flight prices across multiple airlines and booking partners. No booking fees from Himal to Horizon.",
      path: `/results?${search}`,
    });
    return () => { resetSEO(); };
  }, [search]);

  // Reset selection whenever the search URL changes.
  useEffect(() => {
    setSelectedOfferId(null);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Standard search query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<FlightSearchResult>({
    queryKey: ["/api/flights/search", search],
    queryFn: async () => {
      const cacheKey = buildCacheKey("flight-search", {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate ?? "",
        cabinClass: params.cabinClass,
        tripType: params.tripType,
        adults: params.passengers?.adults,
        children: params.passengers?.children,
        infants: params.passengers?.infants,
        currency: params.currency ?? "USD",
        segments: params.segments ? JSON.stringify(params.segments) : "",
      });

      // Cache hit — return immediately without a network call (survives back navigation)
      const cached = sessionGet<FlightSearchResult>(cacheKey);
      if (cached) return cached;

      const res = await apiRequest("POST", "/api/flights/search", {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        cabinClass: params.cabinClass,
        tripType: params.tripType,
        includeNearbyAirports: params.includeNearbyAirports ?? false,
        currency: params.currency ?? "USD",
        ...(params.segments?.length ? { segments: params.segments } : {}),
      });
      const result: FlightSearchResult = await res.json();
      // Store in sessionStorage — 10-minute TTL matches the back-button use case
      sessionSet(cacheKey, result, 10 * 60 * 1000);
      return result;
    },
    enabled: !!(params.origin && params.destination && params.departureDate),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  // Stable price map — persisted for calendar view
  const [stablePriceMap, setStablePriceMap] = useState<{ date: string; price: number; currency: string }[]>([]);

  // Reset stale calendar data and stops filter when the route/date changes
  useEffect(() => {
    setStablePriceMap([]);
    setStopsFilter("any");
  }, [params.origin, params.destination, params.departureDate]);

  // Server-side route stats (Horizon's Prediction) — fetches 30-day average and 7-day sparkline
  const { data: routeStats } = useQuery<RouteStats>({
    queryKey: ["/api/prices/stats", params.origin, params.destination, params.departureDate, params.cabinClass],
    queryFn: async () => {
      const qs = new URLSearchParams({
        origin: params.origin ?? "",
        destination: params.destination ?? "",
        departureDate: params.departureDate ?? "",
        cabinClass: params.cabinClass ?? "economy",
      });
      const res = await fetch(`/api/prices/stats?${qs}`);
      return res.json();
    },
    enabled: !!(params.origin && params.destination && params.departureDate),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });


  // Auto-record cheapest price to server when results load (builds historical dataset)
  const recordPriceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest("POST", "/api/prices/record", payload),
  });

  function handleNewSearch(data: FlightSearchInput) {
    setLocation(`/results?${buildQueryString({ ...data, currency: params.currency ?? "USD" })}`);
    setShowSearch(false);
    setSelectedOfferId(null);
  }

  function handleSelectOffer(offer: FlightOffer) {
    setSelectedOfferId((prev) => (prev === offer.id ? null : offer.id));
  }

  const trackAlertMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiRequest("POST", "/api/alerts", payload),
    onSuccess: () => qcAlerts.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });

  function handleTrackFlight(offer: FlightOffer) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (trackedOfferIds.has(offer.id)) {
      setTrackedOfferIds((prev) => { const next = new Set(prev); next.delete(offer.id); return next; });
      toast({ title: "Removed from Horizons", description: "You've stopped tracking this flight." });
      return;
    }
    const outbound = offer.slices[0];
    const inbound = offer.slices[offer.slices.length - 1];
    const depDate = params.departureDate ?? outbound?.departure_at?.slice(0, 10) ?? "";
    const retDate = params.returnDate ?? (offer.slices.length > 1 ? inbound?.departure_at?.slice(0, 10) : undefined);
    trackAlertMutation.mutate({
      origin: params.origin,
      destination: params.destination,
      departureDate: depDate,
      returnDate: retDate,
      cabinClass: params.cabinClass ?? "economy",
      passengersAdult: params.passengers?.adults ?? 1,
      baselinePrice: parseFloat(offer.total_amount),
      currency: offer.total_currency,
    }, {
      onSuccess: () => {
        setTrackedOfferIds((prev) => new Set(prev).add(offer.id));
        if (!user?.emailVerified) {
          toast({
            title: `Tracking ${params.origin} → ${params.destination}`,
            description: "Verify your email to receive price drop alerts — check your inbox for the verification link.",
          });
        } else {
          toast({
            title: `Tracking ${params.origin} → ${params.destination}`,
            description: "We'll alert you if the price drops by 5%!",
          });
        }
      },
      onError: () => {
        toast({ title: "Couldn't track this flight", description: "Please try again.", variant: "destructive" });
      },
    });
  }

  // Declare offers early so useEffect hooks below can safely reference them
  const rawOffers = data?.offers ?? [];
  const offers = (() => {
    if (!insightFilter || rawOffers.length === 0) return rawOffers;
    const minPrice = Math.min(...rawOffers.map((o) => parseFloat(o.total_amount)));
    const threshold = minPrice * 1.15;
    return rawOffers.filter((o) => parseFloat(o.total_amount) <= threshold);
  })();


  // JSON-LD structured data for flight results SEO
  useEffect(() => {
    const existingScript = document.getElementById("h2h-jsonld");
    if (existingScript) existingScript.remove();
    if (!data || !offers || offers.length === 0 || !params.origin || !params.destination) return;
    const cheapestOffer = offers.reduce((min, o) => (parseFloat(o.total_amount) < parseFloat(min.total_amount) ? o : min), offers[0]);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FlightReservation",
      "provider": {
        "@type": "Organization",
        "name": "Himal to Horizon",
        "url": "https://himaltohorizon.com"
      },
      "reservationFor": {
        "@type": "Flight",
        "departureAirport": { "@type": "Airport", "iataCode": params.origin },
        "arrivalAirport": { "@type": "Airport", "iataCode": params.destination },
        "departureTime": params.departureDate,
        "arrivalTime": params.returnDate ?? undefined
      },
      "offers": {
        "@type": "Offer",
        "price": cheapestOffer.total_amount,
        "priceCurrency": cheapestOffer.total_currency,
        "availability": "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": "Himal to Horizon" }
      }
    };
    const script = document.createElement("script");
    script.id = "h2h-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.getElementById("h2h-jsonld")?.remove(); };
  }, [data, offers, params.origin, params.destination, params.departureDate, params.returnDate]);

  // When fresh results arrive, save/update history and flag insight (once per query key)
  const savedQueryRef = useRef<string | null>(null);
  const currentQueryKey = search;
  if (!isFetching && data && params.origin && params.destination && savedQueryRef.current !== currentQueryKey) {
    savedQueryRef.current = currentQueryKey;
    saveSearch({
      origin: params.origin,
      originLabel: params.origin,
      destination: params.destination,
      destLabel: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      tripType: params.tripType,
      passengers: params.passengers,
      cabinClass: params.cabinClass,
      segments: params.segments,
    });
    if (data.himalInsight) {
      markInsight(params.origin, params.destination);
    }
    // Record cheapest price for Price Confidence feature (localStorage + server DB)
    if (data.offers.length > 0) {
      const cheapest = data.offers[0];
      const cheapestPrice = parseFloat(cheapest.total_amount);
      recordPrice(params.origin, params.destination, params.departureDate, cheapestPrice, cheapest.total_currency);
      // Also record to server DB for cross-user historical dataset
      recordPriceMutation.mutate({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        cabinClass: params.cabinClass ?? "economy",
        price: cheapestPrice,
        currency: cheapest.total_currency,
      });
    }
  }

  // Detect domestic routes
  const isDomestic = (() => {
    const firstOffer = data?.offers?.[0];
    if (!firstOffer) return false;
    const slice = firstOffer.slices[0];
    if (!slice) return false;
    const oc = slice.origin.iata_country_code;
    const dc = slice.destination.iata_country_code;
    return !!oc && !!dc && oc === dc;
  })();

  // Price confidence for cheapest offer — combines localStorage (personal) + server DB (cross-user)
  const cheapestOffer = data?.offers?.[0] ?? null;
  const priceInsightForCheapest = cheapestOffer
    ? {
        ...getPriceInsight(
          params.origin,
          params.destination,
          params.departureDate,
          parseFloat(cheapestOffer.total_amount)
        ),
        serverPrediction: routeStats?.prediction ?? null,
        serverAvgPrice: routeStats?.avgPrice ?? null,
        serverDataPoints: routeStats?.dataPoints ?? 0,
      }
    : null;

  // The selected offer object (for the sticky bar)
  const selectedOffer = selectedOfferId
    ? offers.find((o) => o.id === selectedOfferId) ?? null
    : null;
  const isRoundTrip = params.tripType === "round_trip" && !!params.returnDate;

  // Stops filter applied before sort
  const stopsFilteredOffers = (() => {
    if (stopsFilter === "any") return offers;
    return offers.filter((o) => {
      const stops = getTotalStops(o.slices);
      if (stopsFilter === "nonstop") return stops === 0;
      if (stopsFilter === "one") return stops === 1;
      if (stopsFilter === "two_plus") return stops >= 2;
      return true;
    });
  })();

  // Sorted offers
  const sortedOffers = [...stopsFilteredOffers].sort((a, b) =>
    sortOrder === "shortest_journey"
      ? offerTotalMinutes(a) - offerTotalMinutes(b)
      : parseFloat(a.total_amount) - parseFloat(b.total_amount)
  );
  const cheapestOfferId = offers.length > 0
    ? offers.reduce((min, o) => parseFloat(o.total_amount) < parseFloat(min.total_amount) ? o : min, offers[0]).id
    : null;


  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <button
                type="button"
                data-testid="logo-home"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "instant" });
                  setLocation("/");
                }}
                className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer group"
              >
                <img src={logoImg} alt="Himal to Horizon" className="w-7 h-7 rounded-full object-cover" />
                <span
                  className="font-bold hidden sm:block transition-colors duration-200"
                  style={{ fontFamily: "var(--font-serif)", color: "hsl(var(--foreground))" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(22 79% 75%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                >
                  Himal to Horizon
                </span>
              </button>
            </div>

            <button
              type="button"
              data-testid="button-edit-search"
              aria-label={t("results.edit_search")}
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/50 text-foreground flex-1 max-w-md group hover:border-primary/40 transition-colors duration-150"
              style={{ direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left" }}
            >
              <Plane className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate flex-1 min-w-0">
                <span className="font-bold text-base tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>
                  {params.origin}
                  <span className="mx-1 font-normal text-sm opacity-70">→</span>
                  {params.destination}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDate(params.departureDate, "d MMM")}
                  {params.returnDate && ` – ${formatDate(params.returnDate, "d MMM")}`}
                </span>
              </span>
            </button>

            <div className="flex items-center gap-1 border border-border rounded-md p-1">
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")} data-testid="view-list">
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("results.view_flights")}</span>
              </Button>
              <Button variant={view === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setView("calendar")} data-testid="view-calendar">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("results.view_calendar")}</span>
              </Button>
            </div>

            {/* Track Prices / Sign In */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    data-testid="button-track-prices"
                    onClick={() => {
                      const cheapest = sortedOffers.find((o) => o.id === cheapestOfferId) ?? sortedOffers[0];
                      if (cheapest) handleTrackFlight(cheapest);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={
                      cheapestOfferId && trackedOfferIds.has(cheapestOfferId)
                        ? { background: "rgba(247,176,136,0.18)", color: "#F7B088", borderColor: "rgba(247,176,136,0.4)" }
                        : { background: "rgba(255,255,255,0.03)", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {cheapestOfferId && trackedOfferIds.has(cheapestOfferId) ? <Bell className="w-3.5 h-3.5 shrink-0" /> : <BellOff className="w-3.5 h-3.5 shrink-0" />}
                    <span>{cheapestOfferId && trackedOfferIds.has(cheapestOfferId) ? "Tracking" : "Track this Flight"}</span>
                  </button>
                  <UserMenu user={user} />
                </>
              ) : (
                <button
                  type="button"
                  data-testid="results-sign-in"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
                >
                  <User className="w-3.5 h-3.5" />
                  {t("auth.sign_in")}
                </button>
              )}
            </div>
          </div>

          {showSearch && (
            <div
              className="mb-3 rounded-xl border border-border/60 bg-background/80 backdrop-blur-md shadow-xl"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(247,176,136,0.08)" }}
              data-testid="quick-edit-overlay"
            >
              <div
                className="flex items-center justify-end px-3 pt-2 pb-0"
                style={{ direction: isRtl ? "rtl" : "ltr" }}
              >
                <button
                  type="button"
                  data-testid="button-close-quick-edit"
                  aria-label="Close"
                  onClick={() => setShowSearch(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <FlightSearchForm
                  onSearch={(data) => {
                    setShowSearch(false);
                    handleNewSearch(data);
                  }}
                  compact
                  defaultValues={{
                    origin: params.origin,
                    destination: params.destination,
                    departureDate: params.departureDate,
                    returnDate: params.returnDate,
                    passengers: params.passengers,
                    cabinClass: params.cabinClass,
                    tripType: params.tripType,
                    includeNearbyAirports: params.includeNearbyAirports,
                  }}
                  defaultSegments={params.tripType === "multi_city" && params.segments?.length
                    ? params.segments.map(s => ({
                        origin: s.origin,
                        destination: s.destination,
                        departureDate: s.departureDate,
                      }))
                    : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-16 pb-6">
        {view === "calendar" ? (
          <PriceCalendar
            origin={params.origin}
            destination={params.destination}
            cabinClass={params.cabinClass}
            selectedDate={params.departureDate}
            externalPriceMap={stablePriceMap}
            dotsLoading={stablePriceMap.length === 0}
            onSelectDate={(date) => {
              handleNewSearch({ ...params, departureDate: date });
              setView("list");
            }}
          />
        ) : (
          <div className="xl:flex xl:gap-6 xl:items-start">
          <div className="flex-1 min-w-0">
          <>
            {/* Route + search meta */}
            <div className="mb-5">
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
                {params.origin} → {params.destination}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">{formatDate(params.departureDate, "d MMM yyyy")}</Badge>
                {params.returnDate && (
                  <Badge variant="secondary" className="text-xs">{formatDate(params.returnDate, "d MMM yyyy")}</Badge>
                )}
                <Badge variant="secondary" className="text-xs capitalize">
                  {params.cabinClass.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {params.passengers.adults + params.passengers.children + params.passengers.infants} pax
                </Badge>
                {!isLoading && offers.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">{t("results.flights_found").replace("{n}", String(offers.length))}</span>
                )}
              </div>
            </div>



            {/* EKTA Insurance — always-on banner */}
            {!isLoading && rawOffers.length > 0 && (
              <a
                href="/go/ekta"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="ekta-banner"
                onClick={(e) => {
                  e.preventDefault();
                  trackAffiliateClick("results_ekta_banner", { origin: params.origin, destination: params.destination });
                  safePartnerOpen("/go/ekta");
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3 transition-all hover:opacity-90"
                style={{
                  background: "rgba(56,200,120,0.06)",
                  border: "1px solid rgba(56,200,120,0.2)",
                  textDecoration: "none",
                }}
              >
                <span className="text-xl shrink-0">🛡️</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground">Protect your trip with EKTA</span>
                  <span className="text-[11px] text-muted-foreground ml-2">Medical cover, cancellations & lost baggage — instant policy PDF</span>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md shrink-0"
                  style={{ background: "rgba(56,200,120,0.15)", color: "hsl(145 65% 55%)" }}
                >
                  Get covered →
                </span>
              </a>
            )}

            {/* Horizon's Prediction — redesigned price intelligence panel */}
            {routeStats && (routeStats.trend.length >= 2 || routeStats.prediction) && (() => {
              const cur = data?.offers?.[0]?.total_currency ?? "USD";
              const trendPrices = routeStats.trend.map(p => p.avgPrice);
              const firstRaw = trendPrices.length >= 2 ? trendPrices[0] : null;
              const lastRaw = trendPrices.length >= 2 ? trendPrices[trendPrices.length - 1] : null;
              const changeRaw = firstRaw != null && lastRaw != null ? lastRaw - firstRaw : null;
              const changePct = firstRaw && changeRaw != null ? Math.round((changeRaw / firstRaw) * 100) : null;
              const isRising = changeRaw != null && changeRaw > 2;
              const isFalling = changeRaw != null && changeRaw < -2;
              const changeDisplay = changeRaw != null && Math.abs(changeRaw) > 2
                ? formatCurrency(String((Math.abs(changeRaw) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), cur)
                : null;

              let dirIcon = "→";
              let dirColor = "rgba(255,255,255,0.55)";
              let headline = "Prices stable this week";
              let actionLabel = "";
              let actionColor = "rgba(255,255,255,0.55)";
              let actionIcon = "";

              if (isRising) {
                dirIcon = "↑";
                dirColor = "hsl(0 70% 65%)";
                headline = `Prices went up${changeDisplay ? ` ${changeDisplay}` : ""}${changePct && changePct > 0 ? ` (+${changePct}%)` : ""} this week`;
                if (routeStats.prediction === "buy_now") {
                  actionIcon = "⚡";
                  actionLabel = "Book now — prices are climbing and may keep rising";
                  actionColor = "hsl(145 65% 60%)";
                } else if (routeStats.prediction === "wait") {
                  actionIcon = "⏳";
                  actionLabel = "Prices rose recently but a dip is likely — consider waiting a day or two";
                  actionColor = "hsl(42 90% 65%)";
                } else {
                  actionIcon = "📈";
                  actionLabel = "Prices rising — booking sooner may be cheaper";
                  actionColor = "hsl(0 70% 65%)";
                }
              } else if (isFalling) {
                dirIcon = "↓";
                dirColor = "hsl(145 65% 58%)";
                headline = `Prices dropped${changeDisplay ? ` ${changeDisplay}` : ""}${changePct && changePct < 0 ? ` (${changePct}%)` : ""} this week`;
                if (routeStats.prediction === "wait") {
                  actionIcon = "⏳";
                  actionLabel = "Prices are falling — waiting a day or two may save you more";
                  actionColor = "hsl(145 65% 60%)";
                } else if (routeStats.prediction === "buy_now") {
                  actionIcon = "⚡";
                  actionLabel = "Prices fell but tend to bounce back on this route — book while it's low";
                  actionColor = "hsl(42 90% 65%)";
                } else {
                  actionIcon = "💡";
                  actionLabel = "Good trend — prices have been softening this week";
                  actionColor = "hsl(145 65% 58%)";
                }
              } else {
                dirIcon = "→";
                dirColor = "rgba(255,255,255,0.5)";
                headline = "Prices stable this week";
                if (routeStats.prediction === "buy_now") {
                  actionIcon = "⚡";
                  actionLabel = "Historically, prices on this route rise before departure — book now";
                  actionColor = "hsl(145 65% 60%)";
                } else if (routeStats.prediction === "wait") {
                  actionIcon = "⏳";
                  actionLabel = "Prices have been flat but often dip soon — a better deal may appear";
                  actionColor = "hsl(42 90% 65%)";
                } else if (routeStats.avgPrice) {
                  actionIcon = "◎";
                  actionLabel = `Around the typical average for this route`;
                  actionColor = "rgba(255,255,255,0.45)";
                }
              }

              const avgDisplay = routeStats.avgPrice
                ? formatCurrency(String((routeStats.avgPrice * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), cur)
                : null;

              return (
                <div
                  className="flex items-start gap-4 px-4 py-3 rounded-xl mb-3 flex-wrap"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  data-testid="price-trend-panel"
                >
                  {routeStats.trend.length >= 2 && (
                    <div className="shrink-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        7-day trend
                      </span>
                      <PriceSparkline trend={routeStats.trend} width={180} height={52} currency={cur} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px] justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-black leading-none" style={{ color: dirColor }}>{dirIcon}</span>
                      <span className="text-[13px] font-bold leading-snug" style={{ color: dirColor }}>
                        {headline}
                      </span>
                    </div>
                    {actionLabel && (
                      <p className="text-xs leading-snug mt-0.5" style={{ color: actionColor }}>
                        {actionIcon && <span className="mr-1">{actionIcon}</span>}
                        {actionLabel}
                      </p>
                    )}
                    {avgDisplay && routeStats.dataPoints >= 3 && (
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                        30-day avg {avgDisplay} · {routeStats.dataPoints} searches tracked
                      </p>
                    )}
                    {routeStats.dataPoints > 0 && routeStats.dataPoints < 3 && (
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {routeStats.dataPoints} search{routeStats.dataPoints > 1 ? "es" : ""} tracked on this route so far
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}


            {/* Sort controls */}
            {!isLoading && !error && offers.length > 0 && (
              <div className="mb-5">
                {/* Sort row — shared across both views */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{t("results.sort_label")}</span>
                  <button
                    type="button"
                    data-testid="sort-best-value"
                    onClick={() => setSortOrder("best_value")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-all duration-150"
                    style={
                      sortOrder === "best_value"
                        ? { background: "hsl(42 90% 52% / 0.2)", color: "hsl(42 90% 60%)", border: "1px solid hsl(42 90% 52% / 0.3)" }
                        : { color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    <TrendingDown className="h-3 w-3" />
                    {t("results.sort_best")}
                  </button>
                  <button
                    type="button"
                    data-testid="sort-shortest"
                    onClick={() => setSortOrder("shortest_journey")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-all duration-150"
                    style={
                      sortOrder === "shortest_journey"
                        ? { background: "hsl(176 24% 62% / 0.2)", color: "hsl(176 24% 62%)", border: "1px solid hsl(176 24% 62% / 0.3)" }
                        : { color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    <Clock className="h-3 w-3" />
                    {t("results.sort_shortest")}
                  </button>

                  {/* Divider */}
                  <div className="h-4 w-px mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />

                  {/* Stops filter */}
                  {(
                    [
                      { value: "any",      label: "All" },
                      { value: "nonstop",  label: "Nonstop" },
                      { value: "one",      label: "1 Stop" },
                      { value: "two_plus", label: "2+ Stops" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      data-testid={`filter-stops-${value}`}
                      onClick={() => setStopsFilter(value)}
                      className="px-2.5 py-1 rounded-sm text-xs font-medium transition-all duration-150"
                      style={
                        stopsFilter === value
                          ? { background: "hsl(211 60% 35% / 0.5)", color: "hsl(200 80% 75%)", border: "1px solid hsl(200 80% 65% / 0.4)" }
                          : { color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {params.includeNearbyAirports
                    ? t("results.loading_nearby")
                    : t("results.loading_dates")}
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-md p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Skeleton className="h-16 w-full rounded-sm" />
                  </div>
                ))}
              </div>
            )}

            {/* Friendly Error */}
            {error && (
              <div data-testid="search-error" className="flex flex-col items-center gap-4 py-16 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(247,176,136,0.08)", border: "1px solid rgba(247,176,136,0.2)" }}
                >
                  <MountainSnow className="h-8 w-8" style={{ color: "hsl(22 79% 75%)" }} />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1 text-lg" style={{ fontFamily: "var(--font-serif)" }}>
                    {t("results.no_flights_title")}
                  </div>
                  <div className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    {t("results.no_flights_body")}
                  </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="retry-search"
                  style={{ borderColor: "rgba(247,176,136,0.3)", color: "hsl(22 79% 75%)" }}>
                  {t("results.try_again")}
                </Button>
              </div>
            )}

            {/* No results — show provider panel */}
            {!isLoading && !error && offers.length === 0 && (
              <div data-testid="no-results" className="flex flex-col items-center gap-4 py-10 text-center">
                <Plane className="h-10 w-10 text-muted-foreground" />
                <div>
                  <div className="font-semibold text-foreground mb-1">{t("results.no_flights_title")}</div>
                  <div className="text-sm text-muted-foreground max-w-sm mb-6">
                    {t("results.no_flights_desc")}
                  </div>
                </div>
                {/* Provider price panel — Skyscanner-style */}
                <LivePricesPanel
                  origin={params.origin ?? ""}
                  destination={params.destination ?? ""}
                  departureDate={params.departureDate ?? ""}
                  returnDate={params.returnDate ?? undefined}
                  currency={params.currency ?? "USD"}
                  adults={params.passengers?.adults ?? 1}
                  children={params.passengers?.children ?? 0}
                  infants={params.passengers?.infants ?? 0}
                  cabinClass={params.cabinClass ?? "economy"}
                />
              </div>
            )}

            {/* Stops filter — no matching results */}
            {!isLoading && !error && offers.length > 0 && stopsFilteredOffers.length === 0 && (
              <div data-testid="no-results-stops" className="flex flex-col items-center gap-3 py-10 text-center">
                <Plane className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold text-foreground mb-1">No {stopsFilter === "nonstop" ? "nonstop" : stopsFilter === "one" ? "1-stop" : "2+-stop"} flights found</div>
                  <div className="text-sm text-muted-foreground">
                    Try a different stops filter or{" "}
                    <button
                      type="button"
                      className="underline hover:text-foreground transition-colors"
                      onClick={() => setStopsFilter("any")}
                    >
                      show all flights
                    </button>
                    .
                  </div>
                </div>
              </div>
            )}



            {/* Standard view */}
            {!isLoading && !error && offers.length > 0 && (
              <div className="relative">
                <div className="space-y-3">
                  {sortedOffers.map((offer, i) => (
                    <FlightCard
                      key={offer.id}
                      offer={offer}
                      index={i}
                      isCheapest={offer.id === cheapestOfferId}
                      isSelected={selectedOfferId === offer.id}
                      onSelect={handleSelectOffer}
                      priceInsight={offer.id === cheapestOfferId && priceInsightForCheapest ? priceInsightForCheapest : undefined}
                      isTracked={trackedOfferIds.has(offer.id)}
                      onTrack={handleTrackFlight}
                      tripType={params.tripType}
                      insightVerified={insightFilter}
                    />
                  ))}
                </div>
                {/* Live provider panel — shown below cached results */}
                <div className="mt-5">
                  <LivePricesPanel
                    origin={params.origin ?? ""}
                    destination={params.destination ?? ""}
                    departureDate={params.departureDate ?? ""}
                    returnDate={params.returnDate ?? undefined}
                    currency={params.currency ?? "USD"}
                    adults={params.passengers?.adults ?? 1}
                    children={params.passengers?.children ?? 0}
                    infants={params.passengers?.infants ?? 0}
                    cabinClass={params.cabinClass ?? "economy"}
                  />
                </div>
              </div>
            )}

          </>
          </div>{/* flex-1 min-w-0 */}

          {/* ── Horizon Verified sidebar (xl+ only) ───────────────────── */}
          {!isLoading && rawOffers.length > 0 && (() => {
            const destSlice = rawOffers[0]?.slices?.[0];
            const sideCity = destSlice?.destination?.city_name || params.destination;
            const cards: Array<{ icon: string; title: string; desc: string; cta: string; url: string; testId: string }> = [
              {
                icon: "🎭",
                title: `Things to do in ${sideCity}`,
                desc: "Guided tours, skip-the-queue experiences & day trips.",
                cta: "Explore with Klook",
                url: "/go/viator",
                testId: "sidebar-viator",
              },
              {
                icon: "🛡️",
                title: "Travel insurance",
                desc: "Cancellations, medical cover & trip interruption — sorted.",
                cta: "Get covered by EKTA",
                url: "/go/ekta",
                testId: "sidebar-ekta",
              },
              {
                icon: "🏨",
                title: `Stay in ${sideCity}`,
                desc: "Hotels & resorts — best rates with free cancellation.",
                cta: "Find hotels on Hotels.com",
                url: "/go/agoda",
                testId: "sidebar-agoda",
              },
              {
                icon: "🎟️",
                title: "Museums & attractions",
                desc: "Instant tickets to the world's top landmarks & museums.",
                cta: "Book via Tiqets",
                url: "/go/tiqets",
                testId: "sidebar-tiqets",
              },
            ];
            const destCCSB = destSlice?.destination?.iata_country_code ?? "";
            const SEA_CC_SB = new Set(["TH","VN","MY","ID","PH","SG","KH","LA","MM","BN","TL"]);
            if (SEA_CC_SB.has(destCCSB.toUpperCase())) {
              cards.push({
                icon: "🚌",
                title: "Ground & water transport",
                desc: "Trains, buses & ferries across Southeast Asia.",
                cta: "Book with 12Go",
                url: "/go/12go",
                testId: "sidebar-12go",
              });
            }
            return (
              <aside
                className="hidden xl:flex flex-col gap-3 w-64 shrink-0 sticky"
                style={{ top: "80px" }}
                data-testid="horizon-verified-sidebar"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "hsl(22 79% 75%)" }}
                  >
                    Horizon's Booking Recommendations
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
                </div>
                {cards.map((card) => (
                  <a
                    key={card.testId}
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    data-testid={card.testId}
                    onClick={(e) => {
                      e.preventDefault();
                      trackAffiliateClick(`sidebar_${card.testId}`, { destination: params.destination, sideCity });
                      safePartnerOpen(card.url);
                    }}
                    className="flex flex-col gap-2 p-3 rounded-xl transition-all hover:opacity-85"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      textDecoration: "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{card.icon}</span>
                      <span className="text-xs font-bold text-foreground leading-tight">{card.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{card.desc}</p>
                    <span
                      className="text-[11px] font-semibold mt-auto"
                      style={{ color: "hsl(22 79% 75%)" }}
                    >
                      {card.cta} →
                    </span>
                  </a>
                ))}
              </aside>
            );
          })()}

          </div>
        )}
      </main>

      {/* Sticky selected flight summary bar */}
      {selectedOffer && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
          data-testid="selected-flight-bar"
          style={{
            background: "hsl(211 51% 9% / 0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "2px solid hsl(22 79% 75%)",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "hsl(145 65% 55%)" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(145 65% 55%)" }}>
                  Flight Selected
                </span>
                <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
                  {selectedOffer.slices[0].origin.iata_code}
                  <ArrowRight className="inline h-3.5 w-3.5 mx-1 text-muted-foreground" />
                  {selectedOffer.slices[0].destination.iata_code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedOffer.owner.name}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-serif)", color: "hsl(22 79% 75%)" }}
                >
                  {formatCurrency(String((parseFloat(selectedOffer.total_amount) * (1 + SERVICE_FEE_PERCENT)).toFixed(2)), selectedOffer.total_currency)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedOfferId(null)}
                data-testid="deselect-flight"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "hsl(var(--muted-foreground))" }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {t("results.clear")}
              </Button>
              {selectedOffer && (() => {
                const _o = selectedOffer.slices[0].origin.iata_code;
                const _d = selectedOffer.slices[0].destination.iata_code;
                const _dep = selectedOffer.slices[0].departure_at?.slice(0, 10) ?? "";
                const _ret = selectedOffer.slices.length > 1 ? selectedOffer.slices[1].departure_at?.slice(0, 10) : undefined;
                return (
                  <a
                    href={buildGoogleFlightsUrl(_o, _d, _dep, _ret)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="continue-google"
                    onClick={() => trackAffiliateClick("flight_selected_google", { origin: _o, destination: _d, departureDate: _dep })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold"
                    style={{ background: "hsl(22 79% 75%)", color: "hsl(220 30% 8%)", textDecoration: "none", fontFamily: "var(--font-sans)" }}
                  >
                    Search on Google Flights <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Trip Essentials — contextual affiliate section shown after results load */}
      {rawOffers && rawOffers.length > 0 && !isLoading && (() => {
        const destSliceES = rawOffers[0]?.slices?.[0];
        const destCity = destSliceES?.destination?.city_name || params.destination;
        const destCC = destSliceES?.destination?.iata_country_code ?? "";
        const SEA_CC = new Set(["TH","VN","MY","ID","PH","SG","KH","LA","MM","BN","TL"]);
        const isSEA = SEA_CC.has(destCC.toUpperCase());
        const essentials = [
          {
            icon: "🛡️",
            title: "Travel insurance",
            desc: "Protect your trip against cancellations, delays & medical emergencies.",
            cta: "Get insured with EKTA",
            url: "/go/ekta",
            testId: "essential-insurance",
          },
          {
            icon: "🎭",
            title: `Things to do in ${destCity}`,
            desc: "Tours, guided experiences & skip-the-queue tickets — curated by locals.",
            cta: "Explore with Klook",
            url: "/go/viator",
            testId: "essential-activities",
          },
          {
            icon: "🏨",
            title: `Stay in ${destCity}`,
            desc: "Hotels, resorts & homes — best rates guaranteed with flexible cancellation.",
            cta: "Find hotels on Hotels.com",
            url: "/go/agoda",
            testId: "essential-hotels",
          },
          ...(isSEA ? [{
            icon: "🚌",
            title: "Buses, trains & ferries",
            desc: "Book ground & water transport across Southeast Asia — trains, buses, ferries.",
            cta: "Book with 12Go",
            url: "/go/12go",
            testId: "essential-12go",
          }] : [{
            icon: "🚗",
            title: "Car rental",
            desc: "Compare cars at your destination airport. No hidden fees, instant confirmation.",
            cta: "Browse cars",
            url: "/go/localrent",
            testId: "essential-cars",
          }]),
          {
            icon: "🎟️",
            title: "Museums & attraction tickets",
            desc: "Skip the queue at the world's top museums and landmarks. Instant mobile confirmation.",
            cta: "Browse with Tiqets",
            url: "/go/tiqets",
            testId: "essential-tickets",
          },
        ];
        return (
          <section className="max-w-6xl mx-auto px-4 mt-10 mb-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "hsl(22 79% 75%)" }}>Horizon's Booking Recommendations</span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.15)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {essentials.map((e) => (
                <a
                  key={e.testId}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  data-testid={e.testId}
                  onClick={(ev) => {
                    ev.preventDefault();
                    trackAffiliateClick(`trip_essential_${e.testId}`, { destination: params.destination, destCity });
                    safePartnerOpen(e.url);
                  }}
                  className="flex flex-col gap-2 p-4 rounded-xl transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}
                >
                  <span className="text-2xl">{e.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-foreground leading-tight">{e.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug">{e.desc}</div>
                  </div>
                  <div className="mt-auto pt-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md inline-block"
                      style={{ background: "rgba(247,176,136,0.12)", color: "hsl(22 79% 75%)" }}
                    >
                      {e.cta} →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Minimal footer with legal links */}
      <footer className="border-t border-border/40 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground/70 text-center">{t("footer.disclaimer")}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © Himal to Horizon · <span style={{ color: "rgba(247,176,136,0.7)" }}>himaltohorizon.com</span>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://himaltohorizon.com/privacy"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-privacy"
                style={{ textDecoration: "none" }}
              >
                Privacy Policy
              </a>
              <a
                href="https://himaltohorizon.com/terms"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-terms"
                style={{ textDecoration: "none" }}
              >
                Terms of Service
              </a>
              <button
                type="button"
                onClick={() => setLocation("/affiliate-disclosure")}
                className="text-xs transition-colors"
                data-testid="footer-affiliate"
                style={{ color: "rgba(247,176,136,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F7B088")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(247,176,136,0.7)")}
              >
                Affiliate Disclosure
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
