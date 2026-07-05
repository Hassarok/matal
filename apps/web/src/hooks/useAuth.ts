import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicUser } from '@matal/shared-types';
import { api } from '@/lib/api';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

/**
 * Current session. Backed by GET /auth/me (which silently refreshes an expired
 * access token). Returns `null` for anonymous visitors rather than throwing.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: api.auth.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
    refetch: query.refetch,
  };
}

function useSetSession() {
  const queryClient = useQueryClient();
  return (user: PublicUser | null) => queryClient.setQueryData(AUTH_ME_KEY, user);
}

export function useLogin() {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: api.auth.login,
    onSuccess: (user) => setSession(user),
  });
}

export function useRegister() {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: api.auth.register,
    onSuccess: (user) => setSession(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.logout,
    onSettled: () => {
      queryClient.setQueryData(AUTH_ME_KEY, null);
      queryClient.removeQueries({ queryKey: AUTH_ME_KEY });
    },
  });
}
