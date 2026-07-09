import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

/**
 * Ensures an anonymous guest session cookie exists so a guest can host a live
 * game (the game socket resolves the host identity from that cookie). Signed-in
 * users already have an identity, so it resolves immediately for them.
 *
 * Returns `true` once the visitor is ready to host.
 */
export function useGuestSession(): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      setReady(true);
      return;
    }
    let cancelled = false;
    api.auth
      .guest()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading]);

  return ready;
}
