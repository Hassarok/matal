import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '@matal/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/FullPageLoader';

/**
 * Layout route guard. Renders child routes only for authenticated users
 * (optionally restricted to a role), otherwise redirects to /login and
 * remembers where the user was heading.
 */
export function RequireAuth({ role }: { role?: UserRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
