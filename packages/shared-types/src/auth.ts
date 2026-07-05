import type { PublicUser } from './user';

/** Returned by endpoints that only convey a human-readable outcome. */
export interface MessageResponse {
  message: string;
}

/**
 * Authenticated session payload. Tokens live in httpOnly cookies (never in the
 * body), so the session response only carries the public user.
 */
export interface SessionResponse {
  user: PublicUser;
}
