import NodeCache from 'node-cache';

// Default TTL: 24h. Individual entries can override via setCache(key, val, ttl).
const cache = new NodeCache({
  stdTTL:      parseInt(process.env.CACHE_TTL || '86400', 10),
  checkperiod: 600, // check for expired keys every 10 minutes
});

export function getCache(key: string): unknown {
  return cache.get(key);
}

/** @param ttlSeconds  Optional per-entry TTL override (seconds). 0 = use default. */
export function setCache(key: string, value: unknown, ttlSeconds = 0): void {
  if (ttlSeconds > 0) {
    cache.set(key, value, ttlSeconds);
  } else {
    cache.set(key, value);
  }
}

export function deleteCache(key: string): void {
  cache.del(key);
}
