import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays as dateFnsAddDays } from "date-fns";
import { ArrowLeftRight, Users, Search, PlaneTakeoff, Star, Sparkles, Clock, Trash2, ArrowRight, MapPin, X, Plus, Minus } from "lucide-react";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AirportCombobox, type SelectedPlace } from "@/components/airport-combobox";
import { flightSearchSchema, type FlightSearchInput, type MultiCitySegment } from "@shared/schema";
import { cn, formatDate } from "@/lib/utils";
import {
  getSortedHistory, saveSearch, clearHistory, getDaysLabel, FAVORITE_THRESHOLD,
  type SearchHistoryEntry,
} from "@/lib/search-history";
import { saveLastSearch, type LastSearchState } from "@/lib/last-search";
import { getHubForCoords, loadSavedOrigin, saveOrigin, clearSavedOrigin } from "@/lib/geo-airports";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

const MOUNTAIN_CODES = new Set(["KTM"]);
const SUN_CODES = new Set(["MCO", "MIA", "TPA", "FLL", "PBI", "AUA", "GRU", "GIG", "SSA", "FOR", "BSB", "REC", "MAO", "CNF"]);

function getDestinationIcon(iata: string, label: string): string | null {
  const code = iata.toUpperCase();
  const lower = label.toLowerCase();
  if (MOUNTAIN_CODES.has(code) || lower.includes("nepal") || lower.includes("kathmandu") || lower.includes("himalaya")) return "🏔️";
  if (SUN_CODES.has(code) || lower.includes("florida") || lower.includes("aruba") || lower.includes("brazil") || lower.includes("brasil")) return "☀️";
  return null;
}

type DefaultSegment = {
  origin: string;
  destination: string;
  departureDate: string;
  originLabel?: string;
  destLabel?: string;
};

type Props = {
  onSearch: (data: FlightSearchInput) => void;
  isLoading?: boolean;
  compact?: boolean;
  defaultValues?: Partial<FlightSearchInput>;
  defaultSegments?: DefaultSegment[];
  onOriginChange?: (iata: string, city: string) => void;
  directOnly?: boolean;
  onDirectOnlyChange?: (v: boolean) => void;
};

export function FlightSearchForm({ onSearch, isLoading, compact, defaultValues, defaultSegments, onOriginChange, directOnly: directOnlyProp = false, onDirectOnlyChange }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tripType, setTripType] = useState<"one_way" | "round_trip" | "multi_city">(defaultValues?.tripType ?? "round_trip");
  const [originPlace, setOriginPlace] = useState<SelectedPlace | null>(null);
  const [destPlace, setDestPlace] = useState<SelectedPlace | null>(null);

  const initDate = (offset: number) => format(dateFnsAddDays(new Date(), offset), "yyyy-MM-dd");

  const buildInitSegments = (): MultiCitySegment[] => {
    if (defaultSegments && defaultSegments.length >= 2) {
      return defaultSegments.map(s => ({ origin: s.origin, destination: s.destination, departureDate: s.departureDate }));
    }
    return [
      { origin: "", destination: "", departureDate: initDate(30) },
      { origin: "", destination: "", departureDate: initDate(37) },
    ];
  };

  const buildInitMcPlaces = (): Array<{ origin: SelectedPlace | null; dest: SelectedPlace | null }> => {
    if (defaultSegments && defaultSegments.length >= 2) {
      return defaultSegments.map(s => ({
        origin: s.origin ? { iata_code: s.origin, name: s.originLabel ?? s.origin, city_name: s.originLabel ?? s.origin, type: "city" as const } : null,
        dest: s.destination ? { iata_code: s.destination, name: s.destLabel ?? s.destination, city_name: s.destLabel ?? s.destination, type: "city" as const } : null,
      }));
    }
    return [{ origin: null, dest: null }, { origin: null, dest: null }];
  };

  const [mcSegments, setMcSegments] = useState<MultiCitySegment[]>(buildInitSegments);
  const [mcPlaces, setMcPlaces] = useState<Array<{ origin: SelectedPlace | null; dest: SelectedPlace | null }>>(buildInitMcPlaces);
  const [includeNearby, setIncludeNearby] = useState(defaultValues?.includeNearbyAirports ?? false);
  const [directOnly, setDirectOnly] = useState(directOnlyProp);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<SearchHistoryEntry[]>([]);
  const [autoDetectedOrigin, setAutoDetectedOrigin] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const form = useForm<FlightSearchInput>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      origin: defaultValues?.origin ?? "",
      destination: defaultValues?.destination ?? "",
      departureDate: defaultValues?.departureDate ?? format(dateFnsAddDays(new Date(), 30), "yyyy-MM-dd"),
      returnDate: defaultValues?.returnDate ?? format(dateFnsAddDays(new Date(), 44), "yyyy-MM-dd"),
      passengers: defaultValues?.passengers ?? { adults: 1, children: 0, infants: 0 },
      cabinClass: defaultValues?.cabinClass ?? "economy",
      tripType,
      includeNearbyAirports: defaultValues?.includeNearbyAirports ?? false,
    },
  });

  const passengers = form.watch("passengers");
  const departureDate = form.watch("departureDate");
  const returnDate = form.watch("returnDate");
  const watchedOrigin = form.watch("origin");
  const watchedDestination = form.watch("destination");
  const watchedCabinClass = form.watch("cabinClass");

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  useEffect(() => { setDirectOnly(directOnlyProp); }, [directOnlyProp]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-detect nearest airport from IP — only on the home form (not compact) and when no origin pre-filled
  useEffect(() => {
    if (compact) return;
    if (defaultValues?.origin) return;
    let cancelled = false;

    function applyHistoryFallback() {
      if (cancelled || form.getValues("origin")) return;
      const history = getSortedHistory();
      if (!history.length) return;
      const recent = history[0];
      const place: SelectedPlace = {
        iata_code: recent.origin,
        name: recent.originLabel,
        city_name: recent.originLabel,
        type: "city",
      };
      setOriginPlace(place);
      form.setValue("origin", recent.origin);
      setAutoDetectedOrigin(true);
      onOriginChange?.(recent.origin, recent.originLabel);
    }

    // Shared: resolve a city/region term → airport via autocomplete suggestions
    async function tryResolveAirport(term: string): Promise<boolean> {
      if (cancelled) return false;
      try {
        const suggestRes = await fetch(`/api/places/suggestions?query=${encodeURIComponent(term)}`);
        if (!suggestRes.ok || cancelled) return false;
        const suggestData = await suggestRes.json();
        const rawPlaces: any[] = suggestData.data ?? [];
        if (rawPlaces.length === 0) return false;
        let iata: string | undefined;
        let displayPlace: SelectedPlace | undefined;
        const firstAirport = rawPlaces.find((p) => p.type === "airport");
        if (firstAirport) {
          iata = firstAirport.iata_code;
          displayPlace = { iata_code: iata!, name: firstAirport.name, city_name: firstAirport.city_name || firstAirport.name, type: "airport" };
        } else {
          const raw = rawPlaces[0];
          if (raw.airports?.length) {
            const ap = raw.airports[0];
            iata = ap.iata_code;
            displayPlace = { iata_code: iata!, name: ap.name, city_name: ap.city_name || raw.name, type: "airport" };
          } else {
            iata = raw.iata_code;
            displayPlace = { iata_code: iata!, name: raw.name, city_name: raw.city_name || raw.name, type: raw.type };
          }
        }
        if (!iata || !displayPlace) return false;
        if (!form.getValues("origin") && !cancelled) {
          setOriginPlace(displayPlace);
          form.setValue("origin", iata);
          setAutoDetectedOrigin(true);
          onOriginChange?.(iata, displayPlace.city_name || displayPlace.name || iata);
        }
        return true;
      } catch {
        return false;
      }
    }

    function applyHubDirect(hub: { iata: string; name: string }): boolean {
      if (cancelled || form.getValues("origin")) return false;
      const place: SelectedPlace = {
        iata_code: hub.iata,
        name: hub.name,
        city_name: hub.name,
        type: "airport",
      };
      setOriginPlace(place);
      form.setValue("origin", hub.iata);
      setAutoDetectedOrigin(true);
      onOriginChange?.(hub.iata, hub.name);
      return true;
    }

    async function detectLocation() {
      // ── Step 0: User's saved home airport (highest priority) ──
      if (user?.homeAirport) {
        if (await tryResolveAirport(user.homeAirport)) return;
      }

      // ── Step 0.5: User's manually saved origin from localStorage ──
      const saved = loadSavedOrigin();
      if (saved && !cancelled) {
        const place: SelectedPlace = {
          iata_code: saved.iata,
          name: saved.city,
          city_name: saved.city,
          type: "airport",
        };
        setOriginPlace(place);
        form.setValue("origin", saved.iata);
        setAutoDetectedOrigin(true);
        onOriginChange?.(saved.iata, saved.city);
        return;
      }

      // ── Step 1: Browser geolocation (high accuracy, requires permission) ──
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              (err) => reject(err),
              { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
            );
          });
          if (!cancelled) {
            // Hub weighting: prefer Category A hub within defined radius over nearest city result
            const hub = getHubForCoords(coords.latitude, coords.longitude);
            if (hub && applyHubDirect(hub)) return;

            // Reverse-geocode lat/lon → city name via Nominatim (no API key needed)
            const revRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=en`,
              { headers: { "User-Agent": "HimalToHorizon/1.0" }, signal: AbortSignal.timeout(6000) }
            );
            if (revRes.ok && !cancelled) {
              const revData = await revRes.json();
              const addr = revData.address ?? {};
              const terms = [addr.city, addr.town, addr.village, addr.county, addr.state].filter(Boolean);
              for (const term of terms) {
                if (await tryResolveAirport(term)) return;
              }
            }
          }
        } catch {
          // Geolocation denied or timed out — fall through to IP lookup
        }
      }

      // ── Step 2: IP-based geo fallback ──
      try {
        const geoRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
        if (geoRes.ok && !cancelled) {
          const geo = await geoRes.json();

          // Hub weighting: if IP provides lat/lon, check for nearby Category A hub first
          if (geo.latitude && geo.longitude) {
            const hub = getHubForCoords(Number(geo.latitude), Number(geo.longitude));
            if (hub && applyHubDirect(hub)) return;
          }

          const searchTerms = [geo.city, geo.region].filter(Boolean) as string[];
          for (const term of searchTerms) {
            if (await tryResolveAirport(term)) return;
          }
        }
      } catch {
        // IP lookup failed — fall through to history
      }

      // ── Step 3: Most recent search history ──
      applyHistoryFallback();
    }
    detectLocation();
    return () => { cancelled = true; };
  }, [user?.homeAirport]); // eslint-disable-line react-hooks/exhaustive-deps

  // If departure date moves past the return date, push return forward by 7 days
  useEffect(() => {
    if (tripType !== "round_trip") return;
    const dep = new Date(departureDate + "T12:00:00");
    const ret = returnDate ? new Date(returnDate + "T12:00:00") : null;
    if (ret && dep >= ret) {
      form.setValue("returnDate", format(dateFnsAddDays(dep, 7), "yyyy-MM-dd"));
    }
  }, [departureDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function openHistory() {
    const entries = getSortedHistory();
    setHistoryEntries(entries);
    if (entries.length > 0) setShowHistory(true);
  }

  function swapAirports() {
    const origin = form.getValues("origin");
    const dest = form.getValues("destination");
    form.setValue("origin", dest);
    form.setValue("destination", origin);
    const tmp = originPlace;
    setOriginPlace(destPlace);
    setDestPlace(tmp);
    if (dest && destPlace) onOriginChange?.(dest, destPlace.city_name || destPlace.name || dest);
  }

  function handleMultiCitySubmit() {
    const validSegs = mcSegments.filter(s => s.origin && s.destination && s.departureDate);
    if (validSegs.length < 2) return;
    const passengers = form.getValues("passengers");
    const cabinClass = form.getValues("cabinClass");

    const firstOriginPlace = mcPlaces[0]?.origin;
    const lastDestPlace = mcPlaces[validSegs.length - 1]?.dest;
    const originLabel = firstOriginPlace?.city_name || firstOriginPlace?.name || validSegs[0].origin;
    const destLabel = lastDestPlace?.city_name || lastDestPlace?.name || validSegs[validSegs.length - 1].destination;

    const historySegments = validSegs.map((s, i) => ({
      origin: s.origin,
      originLabel: mcPlaces[i]?.origin?.city_name || mcPlaces[i]?.origin?.name || s.origin,
      destination: s.destination,
      destLabel: mcPlaces[i]?.dest?.city_name || mcPlaces[i]?.dest?.name || s.destination,
      departureDate: s.departureDate,
    }));

    saveSearch({
      origin: validSegs[0].origin,
      originLabel,
      destination: validSegs[validSegs.length - 1].destination,
      destLabel,
      departureDate: validSegs[0].departureDate,
      tripType: "multi_city",
      passengers,
      cabinClass,
      segments: historySegments,
    });

    saveLastSearch({
      tripType: "multi_city",
      origin: validSegs[0].origin,
      destination: validSegs[validSegs.length - 1].destination,
      departureDate: validSegs[0].departureDate,
      passengers,
      cabinClass,
      originLabel,
      destLabel,
      segments: historySegments,
    });

    const searchData: FlightSearchInput = {
      origin: validSegs[0].origin,
      destination: validSegs[validSegs.length - 1].destination,
      departureDate: validSegs[0].departureDate,
      passengers,
      cabinClass,
      tripType: "multi_city",
      includeNearbyAirports: false,
      directOnly: false,
      currency: "USD",
      segments: validSegs,
    };
    onSearch(searchData);
  }

  function handleSubmit(data: FlightSearchInput) {
    if (tripType === "multi_city") { handleMultiCitySubmit(); return; }
    const searchData = { ...data, tripType, includeNearbyAirports: includeNearby, directOnly };
    const oLabel = originPlace?.city_name || originPlace?.name || searchData.origin;
    const dLabel = destPlace?.city_name || destPlace?.name || searchData.destination;
    saveSearch({
      origin: searchData.origin,
      originLabel: oLabel,
      destination: searchData.destination,
      destLabel: dLabel,
      departureDate: searchData.departureDate,
      returnDate: searchData.tripType === "round_trip" ? searchData.returnDate : undefined,
      tripType: searchData.tripType as "one_way" | "round_trip",
      passengers: searchData.passengers,
      cabinClass: searchData.cabinClass,
    });
    saveLastSearch({
      tripType: searchData.tripType as "one_way" | "round_trip",
      origin: searchData.origin,
      destination: searchData.destination,
      departureDate: searchData.departureDate,
      returnDate: searchData.returnDate,
      passengers: searchData.passengers,
      cabinClass: searchData.cabinClass,
      originLabel: oLabel,
      destLabel: dLabel,
    });
    onSearch(searchData);
  }

  function handleHistorySelect(entry: SearchHistoryEntry) {
    setShowHistory(false);
    setTripType(entry.tripType);
    form.setValue("tripType", entry.tripType);
    form.setValue("passengers", entry.passengers);
    form.setValue("cabinClass", entry.cabinClass as FlightSearchInput["cabinClass"]);

    if (entry.tripType === "multi_city" && entry.segments?.length) {
      const segs: MultiCitySegment[] = entry.segments.map(s => ({
        origin: s.origin,
        destination: s.destination,
        departureDate: s.departureDate,
      }));
      setMcSegments(segs);
      setMcPlaces(entry.segments.map(s => ({
        origin: s.origin ? { iata_code: s.origin, name: s.originLabel ?? s.origin, city_name: s.originLabel ?? s.origin, type: "city" as const } : null,
        dest: s.destination ? { iata_code: s.destination, name: s.destLabel ?? s.destination, city_name: s.destLabel ?? s.destination, type: "city" as const } : null,
      })));
      const firstSeg = entry.segments[0];
      const lastSeg = entry.segments[entry.segments.length - 1];
      const searchData: FlightSearchInput = {
        origin: firstSeg.origin,
        destination: lastSeg.destination,
        departureDate: firstSeg.departureDate,
        passengers: entry.passengers,
        cabinClass: entry.cabinClass as FlightSearchInput["cabinClass"],
        tripType: "multi_city",
        includeNearbyAirports: false,
        directOnly: false,
        currency: "USD",
        segments: segs,
      };
      onSearch(searchData);
      return;
    }

    const originSel: SelectedPlace = {
      iata_code: entry.origin,
      name: entry.originLabel,
      city_name: entry.originLabel,
      type: "city",
    };
    const destSel: SelectedPlace = {
      iata_code: entry.destination,
      name: entry.destLabel,
      city_name: entry.destLabel,
      type: "city",
    };
    setOriginPlace(originSel);
    setDestPlace(destSel);
    form.setValue("origin", entry.origin);
    form.setValue("destination", entry.destination);
    form.setValue("departureDate", entry.departureDate);
    if (entry.returnDate) form.setValue("returnDate", entry.returnDate);

    const searchData: FlightSearchInput = {
      origin: entry.origin,
      destination: entry.destination,
      departureDate: entry.departureDate,
      returnDate: entry.returnDate,
      passengers: entry.passengers,
      cabinClass: entry.cabinClass as FlightSearchInput["cabinClass"],
      tripType: entry.tripType,
      includeNearbyAirports: false,
      directOnly: false,
      currency: (entry as any).currency ?? "USD",
    };
    saveSearch({
      origin: entry.origin,
      originLabel: entry.originLabel,
      destination: entry.destination,
      destLabel: entry.destLabel,
      departureDate: entry.departureDate,
      returnDate: entry.returnDate,
      tripType: entry.tripType,
      passengers: entry.passengers,
      cabinClass: entry.cabinClass,
    });
    onSearch(searchData);
  }

  function handleClearHistory() {
    clearHistory();
    setHistoryEntries([]);
    setShowHistory(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} data-testid="flight-search-form">
        <div className={cn("space-y-3", compact && "space-y-2")}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              {(["round_trip", "one_way", "multi_city"] as const).map((tripKey) => (
                <button
                  key={tripKey}
                  type="button"
                  data-testid={`trip-type-${tripKey}`}
                  onClick={() => {
                    setTripType(tripKey);
                    form.setValue("tripType", tripKey);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all",
                    tripType === tripKey
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  {tripKey === "round_trip" ? t("search.round_trip") : tripKey === "one_way" ? t("search.one_way") : t("search.multi_city")}
                </button>
              ))}
            </div>
          </div>

          {/* ── Multi-city segment builder ── */}
          {tripType === "multi_city" && (
            <div className="space-y-2">
              {mcSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className="rounded-md border p-3 space-y-2"
                  style={{ borderColor: "rgba(247,176,136,0.22)", background: "rgba(247,176,136,0.03)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: "hsl(22 79% 75%)" }}
                    >
                      {t("search.flight_n").replace("{n}", String(idx + 1))}
                    </span>
                    {mcSegments.length > 2 && (
                      <button
                        type="button"
                        data-testid={`remove-segment-${idx}`}
                        onClick={() => {
                          const newSegs = mcSegments.filter((_, i) => i !== idx);
                          const newPlaces = mcPlaces.filter((_, i) => i !== idx);
                          setMcSegments(newSegs);
                          setMcPlaces(newPlaces);
                        }}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                        {t("search.remove_flight")}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="flex-1 min-w-40">
                      <AirportCombobox
                        value={seg.origin}
                        label={t("search.from")}
                        placeholder={t("search.placeholder")}
                        testId={`mc-origin-${idx}`}
                        externalSelected={mcPlaces[idx]?.origin}
                        onChange={(iata, place) => {
                          const newSegs = [...mcSegments];
                          newSegs[idx] = { ...newSegs[idx], origin: iata };
                          setMcSegments(newSegs);
                          const newPlaces = [...mcPlaces];
                          newPlaces[idx] = { ...newPlaces[idx], origin: place };
                          setMcPlaces(newPlaces);
                        }}
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-40">
                      <AirportCombobox
                        value={seg.destination}
                        label={t("search.to")}
                        placeholder={t("search.placeholder")}
                        testId={`mc-dest-${idx}`}
                        externalSelected={mcPlaces[idx]?.dest}
                        onChange={(iata, place) => {
                          const newSegs = [...mcSegments];
                          newSegs[idx] = { ...newSegs[idx], destination: iata };
                          // Auto-populate next segment's origin
                          if (idx + 1 < newSegs.length && !newSegs[idx + 1].origin) {
                            newSegs[idx + 1] = { ...newSegs[idx + 1], origin: iata };
                          }
                          setMcSegments(newSegs);
                          const newPlaces = [...mcPlaces];
                          newPlaces[idx] = { ...newPlaces[idx], dest: place };
                          // Mirror place into next segment's origin
                          if (idx + 1 < newPlaces.length && !newPlaces[idx + 1].origin) {
                            newPlaces[idx + 1] = { ...newPlaces[idx + 1], origin: place };
                          }
                          setMcPlaces(newPlaces);
                        }}
                      />
                    </div>
                    <DatePickerField
                      label={t("search.departure")}
                      value={seg.departureDate}
                      onChange={(d) => {
                        const newSegs = [...mcSegments];
                        newSegs[idx] = { ...newSegs[idx], departureDate: d };
                        setMcSegments(newSegs);
                      }}
                      minDate={idx > 0 ? mcSegments[idx - 1].departureDate : undefined}
                      testId={`mc-date-${idx}`}
                    />
                  </div>
                </div>
              ))}
              {mcSegments.length < 5 && (
                <button
                  type="button"
                  data-testid="add-segment"
                  onClick={() => {
                    const last = mcSegments[mcSegments.length - 1];
                    const nextDate = last.departureDate
                      ? format(dateFnsAddDays(new Date(last.departureDate), 7), "yyyy-MM-dd")
                      : initDate(30 + mcSegments.length * 7);
                    setMcSegments([...mcSegments, { origin: last.destination, destination: "", departureDate: nextDate }]);
                    setMcPlaces([...mcPlaces, { origin: mcPlaces[mcPlaces.length - 1]?.dest ?? null, dest: null }]);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-sm border border-dashed transition-colors"
                  style={{ borderColor: "rgba(247,176,136,0.4)", color: "hsl(22 79% 75%)" }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("search.add_flight")}
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2 items-stretch flex-wrap">
            {/* Origin + Swap + Destination + Dates — shown only for standard searches */}
            {tripType !== "multi_city" && (<>
            <div ref={historyRef} className="relative flex gap-2 items-stretch flex-wrap flex-1 min-w-64 pb-1">
              <div className="flex-1 min-w-48">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AirportCombobox
                          value={field.value}
                          onChange={(iata, place) => {
                            field.onChange(iata);
                            setOriginPlace(place);
                            setShowHistory(false);
                            setAutoDetectedOrigin(false);
                            if (iata && place) {
                              const cityLabel = place.city_name || place.name || iata;
                              saveOrigin(iata, cityLabel);
                              onOriginChange?.(iata, cityLabel);
                            }
                          }}
                          placeholder={t("search.placeholder")}
                          label={t("search.from")}
                          testId="input-origin"
                          onQuery={(q) => { if (q.length > 0) setShowHistory(false); }}
                          externalSelected={originPlace}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {autoDetectedOrigin && (
                  <button
                    type="button"
                    data-testid="button-clear-auto-origin"
                    onClick={() => {
                      form.setValue("origin", "");
                      setOriginPlace(null);
                      setAutoDetectedOrigin(false);
                      clearSavedOrigin();
                    }}
                    className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs transition-opacity hover:opacity-70"
                    style={{ background: "rgba(247,176,136,0.12)", color: "hsl(22 79% 75%)" }}
                  >
                    <MapPin className="h-3 w-3" />
                    {t("search.auto_detected")}
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                )}

              </div>

              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={swapAirports}
                data-testid="button-swap-airports"
                className="self-center mt-4"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>

              <div className="flex-1 min-w-48 pb-1">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AirportCombobox
                          value={field.value}
                          onChange={(iata, place) => {
                            field.onChange(iata);
                            setDestPlace(place);
                            setShowHistory(false);
                          }}
                          placeholder={t("search.placeholder")}
                          label={t("search.to")}
                          testId="input-destination"
                          onQuery={(q) => { if (q.length > 0) setShowHistory(false); }}
                          externalSelected={destPlace}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Recent Searches Dropdown */}
              {showHistory && historyEntries.length > 0 && (
                <div
                  data-testid="recent-searches-dropdown"
                  className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(9,18,29,0.96)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(247,176,136,0.22)",
                    boxShadow: "0 20px 56px rgba(0,0,0,0.7)",
                  }}
                >
                  {/* Header */}
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" style={{ color: "hsl(22 79% 75%)" }} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "hsl(22 79% 75%)" }}
                      >
                        {t("home.prev_searches")}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid="clear-history"
                      onClick={(e) => { e.stopPropagation(); handleClearHistory(); }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("search.clear_all")}
                    </button>
                  </div>

                  {/* History rows */}
                  <div>
                    {historyEntries.slice(0, 5).map((entry, i) => {
                      const isFavorite = entry.count >= FAVORITE_THRESHOLD;
                      const daysLabel = getDaysLabel(entry);
                      const destIcon = getDestinationIcon(entry.destination, entry.destLabel);
                      const hasBadge = isFavorite || entry.hadInsight;
                      return (
                        <button
                          key={`${entry.origin}-${entry.destination}-${i}`}
                          type="button"
                          data-testid={`history-item-${entry.origin}-${entry.destination}`}
                          onClick={() => handleHistorySelect(entry)}
                          className="w-full flex items-start gap-3 text-left transition-colors hover:bg-white/5 group"
                          style={{
                            padding: "14px 16px",
                            borderBottom: i < Math.min(historyEntries.length, 5) - 1
                              ? "1px solid rgba(255,255,255,0.07)"
                              : "none",
                          }}
                        >
                          {/* Far-left icon: Star for Favorite, Clock for Recent */}
                          <div className="shrink-0 w-5 flex justify-center pt-0.5">
                            {isFavorite ? (
                              <Star
                                className="h-4 w-4 fill-current"
                                style={{ color: "hsl(42 90% 65%)" }}
                              />
                            ) : (
                              <Clock
                                className="h-4 w-4"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                              />
                            )}
                          </div>

                          {/* Centre column: route + city names + date stacked */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            {/* Route IATA badge */}
                            <div
                              className="inline-flex flex-wrap items-center gap-1 mb-1.5 px-2 py-0.5 rounded-md text-sm font-bold"
                              style={{
                                background: "rgba(247,176,136,0.08)",
                                border: "1px solid rgba(247,176,136,0.18)",
                                fontFamily: "var(--font-serif)",
                              }}
                            >
                              {entry.tripType === "multi_city" && entry.segments?.length ? (
                                entry.segments.flatMap((seg, si) => [
                                  ...(si === 0 ? [<span key={`o${si}`} className="text-foreground">{seg.origin}</span>] : []),
                                  <ArrowRight key={`a${si}`} className="h-3 w-3 shrink-0" style={{ color: "hsl(22 79% 75%)" }} />,
                                  <span key={`d${si}`} className="text-foreground">{seg.destination}</span>,
                                ])
                              ) : (
                                <>
                                  <span className="text-foreground">{entry.origin}</span>
                                  <ArrowRight className="h-3 w-3 shrink-0" style={{ color: "hsl(22 79% 75%)" }} />
                                  <span className="text-foreground">{entry.destination}</span>
                                  {destIcon && (
                                    <span
                                      className="text-base leading-none ml-0.5"
                                      title={destIcon === "🏔️" ? "Mountain destination" : "Sun destination"}
                                      style={{ filter: "saturate(0.85)", opacity: 0.9 }}
                                    >
                                      {destIcon}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {/* City names */}
                            {entry.tripType === "multi_city" && entry.segments?.length ? (
                              <div className="flex flex-col gap-0.5">
                                {entry.segments.map((seg, si) => (
                                  <div key={si} className="text-xs font-semibold text-foreground leading-snug flex items-center gap-1">
                                    <span>{seg.originLabel || seg.origin}</span>
                                    <ArrowRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                                    <span>{seg.destLabel || seg.destination}</span>
                                    <span className="text-muted-foreground ml-auto text-[10px]">{seg.departureDate}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs font-semibold text-foreground truncate leading-snug">
                                {entry.originLabel} → {entry.destLabel}
                              </div>
                            )}
                            {/* Date + trip length (non-multi-city only) */}
                            {entry.tripType !== "multi_city" && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground truncate">
                                {formatDate(entry.departureDate, "d MMM yyyy")}
                                {entry.returnDate && ` – ${formatDate(entry.returnDate, "d MMM yyyy")}`}
                              </span>
                              {daysLabel && (
                                <span
                                  className="text-[10px] font-semibold shrink-0 whitespace-nowrap"
                                  style={{ color: "hsl(22 79% 75%)" }}
                                >
                                  · {daysLabel}
                                </span>
                              )}
                            </div>
                            )}
                          </div>

                          {/* Badges — hard-pinned to far right */}
                          {hasBadge && (
                            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-3 pt-0.5">
                              {isFavorite && (
                                <span
                                  className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                  style={{
                                    background: "hsl(42 90% 52% / 0.15)",
                                    color: "hsl(42 90% 65%)",
                                    border: "1px solid hsl(42 90% 52% / 0.3)",
                                  }}
                                >
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                  {t("search.fav_horizon")}
                                </span>
                              )}
                              {entry.hadInsight && (
                                <span
                                  className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                  style={{
                                    background: "hsl(22 79% 75% / 0.12)",
                                    color: "hsl(22 79% 78%)",
                                    border: "1px solid hsl(22 79% 75% / 0.28)",
                                  }}
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  {t("search.insight_found")}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <DatePickerField
              label={t("search.departure")}
              value={departureDate}
              onChange={(d) => form.setValue("departureDate", d)}
              testId="input-departure"
              origin={watchedOrigin}
              destination={watchedDestination}
              passengers={passengers}
              cabinClass={watchedCabinClass}
            />

            {tripType === "round_trip" && (
              <DatePickerField
                label={t("search.return")}
                value={returnDate ?? ""}
                onChange={(d) => form.setValue("returnDate", d)}
                minDate={departureDate}
                defaultMonth={departureDate}
                testId="input-return"
                origin={watchedOrigin}
                destination={watchedDestination}
                passengers={passengers}
                cabinClass={watchedCabinClass}
              />
            )}
            </>)}

            <PassengerPicker
              passengers={passengers}
              onChange={(p) => form.setValue("passengers", p)}
              cabinClass={form.watch("cabinClass")}
              onCabinChange={(c) => form.setValue("cabinClass", c as FlightSearchInput["cabinClass"])}
            />

            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-search"
              className={cn(
                "self-end mt-4 transition-all duration-150",
                "hover:brightness-[1.08] hover:shadow-[0_4px_20px_rgba(241,178,141,0.32)]",
                compact ? "px-6" : "px-8"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t("search.searching")}
                </span>
              ) : (
                <span className="flex items-center gap-2" style={{ color: "#060D17" }}>
                  <Search className="h-4 w-4" />
                  {t("hero.cta")}
                </span>
              )}
            </Button>
          </div>

          {tripType !== "multi_city" && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="nearby-airports"
                data-testid="checkbox-nearby-airports"
                checked={includeNearby}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  setIncludeNearby(val);
                  form.setValue("includeNearbyAirports", val);
                }}
                className="h-4 w-4"
              />
              <label
                htmlFor="nearby-airports"
                className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
              >
                <PlaneTakeoff className="h-3.5 w-3.5" />
                {t("search.nearby_airports")}
                <span className="text-xs opacity-60">{t("search.nearby_example")}</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="direct-flights-only"
                data-testid="checkbox-direct-only"
                checked={directOnly}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  setDirectOnly(val);
                  onDirectOnlyChange?.(val);
                }}
                className="h-4 w-4"
              />
              <label
                htmlFor="direct-flights-only"
                className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
              >
                <PlaneTakeoff className="h-3.5 w-3.5" />
                Direct flights only
              </label>
            </div>
          </div>
          )}
        </div>
      </form>
    </Form>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  defaultMonth,
  testId,
  origin,
  destination,
  passengers,
  cabinClass,
}: {
  label: string;
  value: string;
  onChange: (d: string) => void;
  minDate?: string;
  defaultMonth?: string;
  testId: string;
  origin?: string;
  destination?: string;
  passengers?: FlightSearchInput["passengers"];
  cabinClass?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [priceMap, setPriceMap] = useState<Record<string, number | null>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [shownMonth, setShownMonth] = useState<Date | undefined>(undefined);

  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const min = minDate ? new Date(minDate + "T12:00:00") : new Date();
  const calendarDefaultMonth = defaultMonth
    ? new Date(defaultMonth + "T12:00:00")
    : selected;

  const canFetchPrices = !!(origin && destination);

  async function fetchPrices(monthDate: Date) {
    if (!canFetchPrices) return;
    const monthStr = format(monthDate, "yyyy-MM");
    setPriceLoading(true);
    try {
      const res = await fetch("/api/flights/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          month: monthStr,
          passengers: passengers ?? { adults: 1, children: 0, infants: 0 },
          cabinClass: cabinClass ?? "economy",
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, number | null> = {};
      for (const day of data.days ?? []) {
        map[day.date] = day.available && day.price != null ? day.price : null;
      }
      setPriceMap(prev => ({ ...prev, ...map }));
    } catch {
      /* silent — calendar still works without colours */
    } finally {
      setPriceLoading(false);
    }
  }

  useEffect(() => {
    if (open && canFetchPrices) {
      const month = shownMonth ?? calendarDefaultMonth ?? selected ?? new Date();
      fetchPrices(month);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const validPrices = Object.values(priceMap)
    .filter((p): p is number => p !== null && p !== undefined)
    .sort((a, b) => a - b);
  const p33 = validPrices[Math.floor(validPrices.length * 0.33)] ?? Infinity;
  const p66 = validPrices[Math.floor(validPrices.length * 0.66)] ?? Infinity;

  function getPriceDot(dateStr: string): string | null {
    const price = priceMap[dateStr];
    if (price == null) return null;
    if (price <= p33) return "#4ade80";
    if (price <= p66) return "#facc15";
    return "#f87171";
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          className="flex flex-col justify-center px-3 py-2 rounded-md border border-input bg-background min-w-32 text-left focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-sm font-semibold text-foreground mt-0.5">
            {value ? formatDate(value, "d MMM yyyy") : t("search.select_date")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {canFetchPrices && (
          <div className="flex items-center gap-3 px-3 pt-2 pb-0 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
              Cheaper
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#facc15" }} />
              Mid
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
              Pricier
            </span>
            {priceLoading && <span className="ml-auto opacity-50 animate-pulse">loading…</span>}
          </div>
        )}
        <Calendar
          mode="single"
          selected={selected}
          month={shownMonth ?? calendarDefaultMonth}
          onMonthChange={(m) => {
            setShownMonth(m);
            fetchPrices(m);
          }}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={(d) => d < min}
          initialFocus
          components={{
            DayContent: ({ date }) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dot = getPriceDot(dateStr);
              return (
                <div className="relative flex flex-col items-center w-full leading-none pb-1.5">
                  <span>{date.getDate()}</span>
                  {dot && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: dot }}
                    />
                  )}
                </div>
              );
            },
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function PassengerPicker({
  passengers,
  onChange,
  cabinClass,
  onCabinChange,
}: {
  passengers: FlightSearchInput["passengers"];
  onChange: (p: FlightSearchInput["passengers"]) => void;
  cabinClass: string;
  onCabinChange: (c: string) => void;
}) {
  const { t } = useLanguage();
  const total = passengers.adults + passengers.children + passengers.infants;

  const passengerLabels = {
    adults: { label: t("search.adults"), age: t("search.adults_age") },
    children: { label: t("search.children"), age: t("search.children_age") },
    infants: { label: t("search.infants"), age: t("search.infants_age") },
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="input-passengers"
          className="flex flex-col justify-center px-3 py-2 rounded-md border border-input bg-background min-w-36 text-left focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("search.passengers_class")}</span>
          <span className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {total} {total !== 1 ? t("search.passengers").toLowerCase() : t("search.passengers").toLowerCase().replace(/s$/, "")} · {cabinClass.replace("_", " ")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground mb-2">{t("search.passengers")}</div>
          {(["adults", "children", "infants"] as const).map((type) => (
            <div key={type} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{passengerLabels[type].label}</div>
                <div className="text-xs text-muted-foreground">{passengerLabels[type].age}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  data-testid={`decrease-${type}`}
                  disabled={type === "adults" ? passengers[type] <= 1 : passengers[type] <= 0}
                  onClick={() => onChange({ ...passengers, [type]: Math.max(type === "adults" ? 1 : 0, passengers[type] - 1) })}
                >
                  <span className="text-base leading-none">−</span>
                </Button>
                <span className="w-6 text-center text-sm font-semibold" data-testid={`count-${type}`}>
                  {passengers[type]}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  data-testid={`increase-${type}`}
                  disabled={total >= 9}
                  onClick={() => onChange({ ...passengers, [type]: passengers[type] + 1 })}
                >
                  <span className="text-base leading-none">+</span>
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <div className="text-sm font-semibold mb-2">{t("search.cabin_class")}</div>
            <Select value={cabinClass} onValueChange={onCabinChange}>
              <SelectTrigger data-testid="select-cabin">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">{t("search.economy")}</SelectItem>
                <SelectItem value="premium_economy">{t("search.premium_economy")}</SelectItem>
                <SelectItem value="business">{t("search.business")}</SelectItem>
                <SelectItem value="first">{t("search.first")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
