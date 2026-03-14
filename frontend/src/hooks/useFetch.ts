import { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://career-os-backend-production.up.railway.app').replace(/\/$/, '');

export function useFetch<T>(endpoint: string, fallbackData: T) {
  const { profile, cacheVersion } = useProfile();
  const [data, setData] = useState<T>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLoading(true);

    // Append profile query parameter to all requests
    const connector = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE}${endpoint}${connector}profile=${profile}`;

    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setSource(d.source || 'static');
      })
      .catch((err) => {
        console.warn(`Fetch failed for ${endpoint}:`, err);
        setData(fallbackData);
        setSource('demo');
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [endpoint, profile, cacheVersion, fallbackData]);

  return { data, loading, source };
}
