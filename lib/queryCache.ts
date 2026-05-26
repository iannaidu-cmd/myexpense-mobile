// Simple in-memory TTL cache for Supabase read queries.
// Lives for the lifetime of the JS bundle — no persistence across restarts.
// Call invalidate() after any mutation so stale data is never shown.

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store: Record<string, CacheEntry> = {};

export function getCached<T>(key: string): T | null {
  const entry = store[key];
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = 120_000): void {
  store[key] = { value, expiresAt: Date.now() + ttlMs };
}

// Removes all keys that start with the given prefix.
export function invalidatePrefix(prefix: string): void {
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) delete store[key];
  }
}
