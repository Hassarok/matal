import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. Use together with `RolesGuard`:
 * `@UseGuards(JwtAuthGuard, RolesGuard)` `@Roles('ADMIN')`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
