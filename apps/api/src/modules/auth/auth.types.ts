import type { UserRole } from '@prisma/client';

/** Payload embedded in the signed access-token JWT. */
export interface JwtPayload {
  sub: string;
  role: UserRole;
}

/**
 * Payload of a guest (anonymous) token. Carries only a random, stable
 * identifier — no DB row, no role. Distinguished from a real access token by
 * the `guest` flag so the two are never confused.
 */
export interface GuestJwtPayload {
  sub: string;
  guest: true;
}

/** The authenticated principal attached to the request by the JWT guard. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/** Cookie names used for the access, refresh & guest tokens. */
export const ACCESS_COOKIE = 'matal_at';
export const REFRESH_COOKIE = 'matal_rt';
export const GUEST_COOKIE = 'matal_gid';

/**
 * Lifetime of a guest token/cookie. Long-lived so an anonymous visitor keeps
 * the same identity (and can reconnect as a game host) across sessions, until
 * they sign in. 30 days.
 */
export const GUEST_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
