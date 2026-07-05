import type { User } from '@prisma/client';
import { type PublicUser, UserRole } from '@matal/shared-types';

/**
 * Maps a database User to the public representation sent to clients.
 * Secrets (password hash, tokens) are never included.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role === 'ADMIN' ? UserRole.Admin : UserRole.User,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    organizationId: user.organizationId,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
