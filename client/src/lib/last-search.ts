const KEY = "h2h_last_search_state";

export type LastSearchState = {
  tripType: "one_way" | "round_trip" | "multi_city";
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: { adults: number; children: number; infants: number };
  cabinClass: string;
  originLabel?: string;
  destLabel?: string;
  segments?: Array<{
    origin: string;
    destination: string;
    departureDate: string;
    originLabel?: string;
    destLabel?: string;
  }>;
};

export function saveLastSearch(state: LastSearchState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function loadLastSearch(): LastSearchState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastSearchState) : null;
  } catch {
    return null;
  }
}
