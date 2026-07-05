import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Category reference data (rarely changes → long stale time). */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    staleTime: 60 * 60 * 1000,
  });
}
