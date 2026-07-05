import type { UserRole } from '@prisma/client';

/** Payload embedded in the signed access-token JWT. */
export interface JwtPayload {
  sub: string;
  role: UserRole;
}

/** The authenticated principal attached to the request by the JWT guard. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/** Cookie names used for the access & refresh tokens. */
export const ACCESS_COOKIE = 'matal_at';
export const REFRESH_COOKIE = 'matal_rt';
