import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Polls the API health endpoint. Used by the landing page to prove REST
 * connectivity and surface database status.
 */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 15_000,
  });
}
