import { useState, useEffect, useCallback } from 'react';
import type { SystemMetrics } from '../types';

const API_URL = 'http://localhost:3001/api/metrics';

const API_KEY = import.meta.env.VITE_BTOP_API_KEY;
const MAX_RETRIES = 10;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

interface UseSystemMetricsResult {
  metrics: SystemMetrics | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSystemMetrics(refreshRate: number): UseSystemMetricsResult {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        headers: API_KEY ? {
          'Authorization': `Bearer ${API_KEY}`,
        } : {},
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setRetryCount(prev => {
        const next = prev + 1;
        if (next < MAX_RETRIES) {
          const delay = Math.min(BASE_DELAY * 2 ** prev, MAX_DELAY);
          setTimeout(fetchMetrics, delay);
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (refreshRate === 0) return; // paused
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshRate);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshRate]);

  return { metrics, error, loading, refresh: fetchMetrics };
}
