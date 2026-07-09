import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicUser } from '@matal/shared-types';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toaster';
import { hasGuestQuizzes, migrateGuestQuizzesToAccount } from '@/lib/quizStore';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

/**
 * Carries any quizzes a visitor built while signed out into their account, then
 * refreshes the quiz lists. Runs once on sign-in/registration; failures are
 * non-fatal (the guest data simply stays local).
 */
async function upgradeGuestSession(queryClient: ReturnType<typeof useQueryClient>) {
  if (!hasGuestQuizzes()) return;
  try {
    const imported = await migrateGuestQuizzesToAccount();
    if (imported > 0) {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success(
        `${imported} quiz${imported === 1 ? '' : 'zes'} saved to your account.`,
      );
    }
  } catch {
    // Keep the guest data local if the import fails.
  }
}

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.login,
    onSuccess: (user) => {
      setSession(user);
      void upgradeGuestSession(queryClient);
    },
  });
}

export function useRegister() {
  const setSession = useSetSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.auth.register,
    onSuccess: (user) => {
      setSession(user);
      void upgradeGuestSession(queryClient);
    },
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
