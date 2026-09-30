// Session cache backed by sessionStorage — survives browser back/forward navigation
// but is cleared when the tab is closed (unlike localStorage).

const CACHE_VERSION = "h2h_v1";
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttl: number;
}

function makeKey(key: string): string {
  return `${CACHE_VERSION}:${key}`;
}

export function sessionGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(makeKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > entry.ttl) {
      sessionStorage.removeItem(makeKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function sessionSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now(), ttl: ttlMs };
    sessionStorage.setItem(makeKey(key), JSON.stringify(entry));
  } catch {
    // sessionStorage can throw if storage quota is exceeded — fail silently
  }
}

// Build a stable cache key from an arbitrary object (sorted keys for consistency)
export function buildCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sorted)}`;
}
