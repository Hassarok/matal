import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/FullPageLoader';

/** Keeps already-signed-in users away from the login/register pages. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/profile" replace />;
  return <>{children}</>;
}
