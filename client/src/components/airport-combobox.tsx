import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Building2, Plane, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PlaceAirport = {
  iata_code: string;
  name: string;
  city_name: string | null;
};

type PlaceSuggestion = {
  id: string;
  type: "city" | "airport";
  name: string;
  iata_code: string;
  iata_city_code: string | null;
  iata_country_code: string | null;
  city_name: string | null;
  airports: PlaceAirport[] | null;
};

export type SelectedPlace = {
  iata_code: string;
  name: string;
  city_name: string;
  type: "city" | "airport";
};

type Props = {
  value: string;
  onChange: (iata: string, place: SelectedPlace) => void;
  placeholder: string;
  label: string;
  testId: string;
  onFocus?: () => void;
  onQuery?: (query: string) => void;
  externalSelected?: SelectedPlace | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// In-memory cache for autocomplete suggestions — prevents duplicate API calls for the same query
const suggestionsCache = new Map<string, { data: PlaceSuggestion[]; ts: number }>();
const SUGGESTIONS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function AirportCombobox({ value, onChange, placeholder, label, testId, onFocus, onQuery, externalSelected }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 350ms debounce — waits for the user to pause before firing a network request
  const debouncedQuery = useDebounce(query, 350);

  // Only sync external selection when it's a real place object (not null/undefined)
  // This prevents the history-restore mechanism from accidentally clearing a live selection
  useEffect(() => {
    if (externalSelected != null) {
      setSelected(externalSelected);
    }
  }, [externalSelected]);

  useEffect(() => {
    // Require at least 2 characters — single-letter queries produce noisy, unhelpful results
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cache hit — serve instantly without a network round-trip
    const cacheKey = debouncedQuery.toLowerCase().trim();
    const cached = suggestionsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SUGGESTIONS_CACHE_TTL_MS) {
      setSuggestions(cached.data);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/places/suggestions?query=${encodeURIComponent(debouncedQuery)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const results = data.data ?? [];
          suggestionsCache.set(cacheKey, { data: results, ts: Date.now() });
          setSuggestions(results);
          setActiveIndex(-1);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectPlace(place: SelectedPlace) {
    setSelected(place);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onChange(place.iata_code, place);
  }

  function handleCitySelect(s: PlaceSuggestion) {
    selectPlace({
      iata_code: s.iata_code,
      name: s.name,
      city_name: s.name,
      type: "city",
    });
  }

  function handleAirportSelect(airport: PlaceAirport, parentCityName?: string) {
    selectPlace({
      iata_code: airport.iata_code,
      name: airport.name,
      city_name: airport.city_name ?? parentCityName ?? "",
      type: "airport",
    });
  }

  function handleSuggestionSelect(s: PlaceSuggestion) {
    if (s.type === "airport") {
      handleAirportSelect({ iata_code: s.iata_code, name: s.name, city_name: s.city_name }, s.city_name ?? "");
    } else {
      handleCitySelect(s);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const flatItems = getFlatItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) handleFlatItemSelect(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  type FlatItem =
    | { kind: "city"; suggestion: PlaceSuggestion }
    | { kind: "airport"; airport: PlaceAirport; parentName: string };

  function getFlatItems(): FlatItem[] {
    const items: FlatItem[] = [];
    for (const s of suggestions) {
      if (s.type === "city") {
        items.push({ kind: "city", suggestion: s });
        if (s.airports) {
          for (const a of s.airports) {
            items.push({ kind: "airport", airport: a, parentName: s.name });
          }
        }
      } else {
        items.push({ kind: "city", suggestion: s });
      }
    }
    return items;
  }

  function handleFlatItemSelect(item: FlatItem) {
    if (item.kind === "city") {
      handleSuggestionSelect(item.suggestion);
    } else {
      handleAirportSelect(item.airport, item.parentName);
    }
  }

  const displayValue = selected
    ? selected.type === "city"
      ? `${selected.name} (${selected.iata_code})`
      : `${selected.city_name} — ${selected.name} (${selected.iata_code})`
    : value
    ? value
    : "";

  const showDropdown = open && (isLoading || suggestions.length > 0 || query.length > 0);
  const flatItems = getFlatItems();
  let flatIdx = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-2 px-3 rounded-md border bg-background transition-all",
          "min-h-[52px] py-2.5 h-full",
          open
            ? "border-ring ring-2 ring-ring"
            : "border-input"
        )}
      >
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none leading-none">
            {label}
          </label>
          {open ? (
            <input
              ref={inputRef}
              autoFocus
              data-testid={testId}
              autoComplete="off"
              spellCheck={false}
              className="bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 w-full leading-snug"
              placeholder="Search city or airport..."
              value={query}
              onChange={(e) => {
                const q = e.target.value;
                setQuery(q);
                onQuery?.(q);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => { setTimeout(() => setOpen(false), 150); }}
              aria-autocomplete="list"
              aria-expanded={open}
            />
          ) : (
            <input
              ref={inputRef}
              data-testid={testId}
              autoComplete="off"
              spellCheck={false}
              readOnly
              className="bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 w-full leading-snug truncate cursor-pointer"
              placeholder={placeholder}
              value={displayValue}
              onFocus={() => {
                setOpen(true);
                setQuery("");
                onFocus?.();
              }}
              onKeyDown={handleKeyDown}
              aria-autocomplete="list"
              aria-expanded={open}
            />
          )}
        </div>
        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-[60] rounded-md border border-border bg-popover shadow-xl max-h-72 overflow-y-auto scrollbar-thin"
          role="listbox"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching...
            </div>
          )}

          {!isLoading && query.length > 0 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results for "{query}"
            </div>
          )}

          {suggestions.map((s) => {
            if (s.type === "city") {
              const cityFlatIdx = flatIdx;
              flatIdx++;
              const isCityActive = activeIndex === cityFlatIdx;

              const cityAirports = s.airports ?? [];

              return (
                <div key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCityActive}
                    data-testid={`place-option-${s.iata_code}`}
                    onClick={() => handleCitySelect(s)}
                    className={cn(
                      "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors",
                      isCityActive ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{s.name}</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                          {s.iata_code}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        All airports · {s.iata_country_code}
                        {cityAirports.length > 0 && ` · ${cityAirports.length} airports`}
                      </div>
                    </div>
                  </button>

                  {cityAirports.map((airport) => {
                    const airportFlatIdx = flatIdx;
                    flatIdx++;
                    const isAirportActive = activeIndex === airportFlatIdx;

                    return (
                      <button
                        key={airport.iata_code}
                        type="button"
                        role="option"
                        aria-selected={isAirportActive}
                        data-testid={`place-option-${airport.iata_code}`}
                        onClick={() => handleAirportSelect(airport, s.name)}
                        className={cn(
                          "w-full pl-6 pr-3 py-2 flex items-center gap-3 text-left transition-colors",
                          isAirportActive ? "bg-accent" : "hover:bg-accent/60"
                        )}
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted shrink-0">
                          <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground truncate">{airport.name}</span>
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm shrink-0">
                              {airport.iata_code}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            } else {
              const idx = flatIdx;
              flatIdx++;
              const isActive = activeIndex === idx;

              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-testid={`place-option-${s.iata_code}`}
                  onClick={() => handleSuggestionSelect(s)}
                  className={cn(
                    "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors",
                    isActive ? "bg-accent" : "hover:bg-accent/60"
                  )}
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-md bg-muted shrink-0">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm shrink-0">
                        {s.iata_code}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.city_name && s.city_name !== s.name ? `${s.city_name} · ` : ""}
                      {s.iata_country_code}
                    </div>
                  </div>
                </button>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
