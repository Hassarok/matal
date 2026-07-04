import type { UserRole } from './enums';

/**
 * Public-facing user representation. Never contains secrets
 * (password hashes, tokens) — those never leave the API boundary.
 */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  /**
   * Future multi-tenant seam (organizations/schools/companies).
   * Null for personal accounts — present from day one so adding
   * organizations later is additive, never a schema refactor.
   */
  organizationId: string | null;
  emailVerified: boolean;
  createdAt: string;
}
