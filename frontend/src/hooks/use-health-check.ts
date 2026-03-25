import { useState, useEffect } from 'react';
import { getHealth } from '../lib/api';
import type { HealthStatus } from '../types';

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function check() {
      try {
        setLoading(true);
        const data = await getHealth();
        if (mounted) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch health'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    check();
    
    // Optional: poll every minute
    const intervalId = setInterval(check, 60000);
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { health, loading, error };
}
