/**
 * Two-layer bbox cache for Supabase structure queries.
 *
 * Layer 1 – In-Memory (Map):  zero-latency hits for pan/zoom during the session.
 * Layer 2 – localStorage:     persists across page reloads with a TTL.
 *
 * Key strategy: bbox coordinates are rounded to 3 decimal places (~111m precision)
 * so minor sub-pixel pans reuse the same cache entry.
 */

const MEMORY_CACHE = new Map<string, { data: unknown[]; count: number; ts: number }>();
const LS_PREFIX = "jmt_bbox_";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Round bbox coords to 3dp to absorb micro-pans */
function buildKey(
  swLat: number, swLng: number, neLat: number, neLng: number, page: number,
  filters?: { audience?: number | null; mediaType?: string; minPrice?: number | null; maxPrice?: number | null }
): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const filterStr = filters 
    ? `f_${filters.audience || ''}_${filters.mediaType || ''}_${filters.minPrice || ''}_${filters.maxPrice || ''}`
    : '';
  return `${r(swLat)},${r(swLng)},${r(neLat)},${r(neLng)},p${page}_${filterStr}`;
}

export interface CacheEntry {
  data: unknown[];
  count: number;
}

export function getCached(
  swLat: number, swLng: number, neLat: number, neLng: number, page: number,
  filters?: { audience?: number | null; mediaType?: string; minPrice?: number | null; maxPrice?: number | null }
): CacheEntry | null {
  const key = buildKey(swLat, swLng, neLat, neLng, page, filters);
  const now = Date.now();

  // Layer 1: memory
  const mem = MEMORY_CACHE.get(key);
  if (mem && now - mem.ts < TTL_MS) {
    return { data: mem.data, count: mem.count };
  }

  // Layer 2: localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: unknown[]; count: number; ts: number };
        if (now - parsed.ts < TTL_MS) {
          // Warm memory layer back up
          MEMORY_CACHE.set(key, parsed);
          return { data: parsed.data, count: parsed.count };
        }
        // Expired — clean up
        localStorage.removeItem(LS_PREFIX + key);
      }
    } catch {
      // localStorage unavailable or corrupt — silently skip
    }
  }

  return null;
}

export function setCached(
  swLat: number, swLng: number, neLat: number, neLng: number,
  page: number, data: unknown[], count: number,
  filters?: { audience?: number | null; mediaType?: string; minPrice?: number | null; maxPrice?: number | null }
): void {
  const key = buildKey(swLat, swLng, neLat, neLng, page, filters);
  const entry = { data, count, ts: Date.now() };

  // Layer 1: memory (always)
  MEMORY_CACHE.set(key, entry);

  // Layer 2: localStorage (best-effort; may fail if quota exceeded)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Quota exceeded — evict oldest jmt_ entries and retry once
      evictOldestLS();
      try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
      } catch {
        // Give up silently
      }
    }
  }
}

/** Remove all expired JMT bbox cache entries from localStorage */
function evictOldestLS() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) {
      try {
        const parsed = JSON.parse(localStorage.getItem(k)!);
        if (now - parsed.ts > TTL_MS) toDelete.push(k);
      } catch {
        toDelete.push(k!);
      }
    }
  }
  toDelete.forEach((k) => localStorage.removeItem(k));
}

/** Invalidate ALL cached entries (e.g. after a database update) */
export function invalidateAll() {
  MEMORY_CACHE.clear();
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
