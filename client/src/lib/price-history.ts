const PRICE_HISTORY_KEY = "h2h_price_history";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type PriceRecord = {
  price: number;
  currency: string;
  timestamp: number;
};

type PriceHistoryStore = Record<string, PriceRecord[]>;

function priceKey(origin: string, destination: string, departureDate: string): string {
  return `${origin}-${destination}-${departureDate}`;
}

function load(): PriceHistoryStore {
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as PriceHistoryStore) : {};
  } catch {
    return {};
  }
}

function save(store: PriceHistoryStore) {
  try {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(store));
  } catch {}
}

export function recordPrice(
  origin: string,
  destination: string,
  departureDate: string,
  price: number,
  currency: string
) {
  const store = load();
  const key = priceKey(origin, destination, departureDate);
  const now = Date.now();
  const cutoff = now - RETENTION_MS;

  const existing = (store[key] ?? []).filter((r) => r.timestamp > cutoff);
  existing.push({ price, currency, timestamp: now });
  store[key] = existing;
  save(store);
}

export type PriceInsight = {
  isBuyNow: boolean;
  isWait: boolean;
  prediction: "rise" | "fall" | null;
  predictionPct: number | null;
  historicalMin: number | null;
  historicalAvg: number | null;
  dataPoints: number;
  // Server-side prediction from route_price_history
  serverPrediction?: "buy_now" | "wait" | null;
  serverAvgPrice?: number | null;
  serverDataPoints?: number;
};

export function getPriceInsight(
  origin: string,
  destination: string,
  departureDate: string,
  currentPrice: number
): PriceInsight {
  const store = load();
  const key = priceKey(origin, destination, departureDate);
  const now = Date.now();
  const cutoff = now - RETENTION_MS;
  const records = (store[key] ?? []).filter((r) => r.timestamp > cutoff);

  if (records.length < 2) {
    return { isBuyNow: false, isWait: false, prediction: null, predictionPct: null, historicalMin: null, historicalAvg: null, dataPoints: records.length };
  }

  const prices = records.map((r) => r.price);
  const historicalMin = Math.min(...prices);
  const historicalAvg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const isBuyNow = currentPrice <= historicalMin * 1.02;
  const isWait = currentPrice > historicalAvg * 1.10;

  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const recent = records.filter((r) => r.timestamp > threeDaysAgo);
  const older = records.filter((r) => r.timestamp <= threeDaysAgo);

  let prediction: "rise" | "fall" | null = null;
  let predictionPct: number | null = null;

  if (recent.length >= 1 && older.length >= 1) {
    const recentAvg = recent.reduce((s, r) => s + r.price, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.price, 0) / older.length;
    const changePct = ((recentAvg - olderAvg) / olderAvg) * 100;
    prediction = changePct > 0 ? "rise" : "fall";
    predictionPct = Math.abs(Math.round(changePct));
  }

  return { isBuyNow, isWait, prediction, predictionPct, historicalMin, historicalAvg, dataPoints: records.length };
}
