import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || '86400', 10) });

export function getCache(key: string) {
  return cache.get(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, value);
}
