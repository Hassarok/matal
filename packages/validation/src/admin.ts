import { z } from 'zod';
import { UserRole } from '@matal/shared-types';

/** Query params for the admin user/quiz lists (pagination + free-text search). */
export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
});
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

/** Body for changing a user's platform role. */
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
