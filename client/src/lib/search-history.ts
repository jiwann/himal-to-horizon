const HISTORY_KEY = "h2h_search_history";
const MAX_HISTORY = 10;
export const FAVORITE_THRESHOLD = 3;

export type MultiCityHistorySegment = {
  origin: string;
  originLabel?: string;
  destination: string;
  destLabel?: string;
  departureDate: string;
};

export type SearchHistoryEntry = {
  origin: string;
  originLabel: string;
  destination: string;
  destLabel: string;
  departureDate: string;
  returnDate?: string;
  tripType: "one_way" | "round_trip" | "multi_city";
  passengers: { adults: number; children: number; infants: number };
  cabinClass: string;
  count: number;
  hadInsight: boolean;
  lastSearched: number;
  segments?: MultiCityHistorySegment[];
};

function routeKey(origin: string, dest: string, departureDate?: string) {
  return `${origin}-${dest}${departureDate ? `-${departureDate}` : ""}`;
}

export function loadHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryEntry[];
  } catch {
    return [];
  }
}

function writeHistory(entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {}
}

export function saveSearch(
  entry: Omit<SearchHistoryEntry, "count" | "hadInsight" | "lastSearched">
) {
  const history = loadHistory();
  const key = routeKey(entry.origin, entry.destination, entry.departureDate);
  const idx = history.findIndex((e) => routeKey(e.origin, e.destination, e.departureDate) === key);

  if (idx >= 0) {
    const existing = history.splice(idx, 1)[0];
    history.unshift({
      ...entry,
      count: existing.count + 1,
      hadInsight: existing.hadInsight,
      lastSearched: Date.now(),
    });
  } else {
    history.unshift({
      ...entry,
      count: 1,
      hadInsight: false,
      lastSearched: Date.now(),
    });
  }

  writeHistory(history.slice(0, MAX_HISTORY));
}

export function markInsight(origin: string, destination: string) {
  const history = loadHistory();
  const key = routeKey(origin, destination);
  const entry = history.find((e) => routeKey(e.origin, e.destination) === key); // route-only for insight marking
  if (entry) {
    entry.hadInsight = true;
    writeHistory(history);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export function getSortedHistory(): SearchHistoryEntry[] {
  const history = loadHistory();
  return [...history].sort((a, b) => {
    const aFav = a.count >= FAVORITE_THRESHOLD ? 1 : 0;
    const bFav = b.count >= FAVORITE_THRESHOLD ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return b.lastSearched - a.lastSearched;
  });
}

export function getDaysLabel(entry: SearchHistoryEntry): string | null {
  if (!entry.returnDate) return null;
  const dep = new Date(entry.departureDate);
  const ret = new Date(entry.returnDate);
  const days = Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? "s" : ""}`;
}
