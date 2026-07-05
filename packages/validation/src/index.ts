/**
 * @matal/validation
 * Zod schemas shared by the MATAL API (request validation) and the web
 * client (form validation). One definition, enforced on both sides.
 *
 * Explicit named re-exports keep every export statically detectable by
 * bundlers consuming the CommonJS build.
 */
export {
  emailSchema,
  usernameSchema,
  displayNameSchema,
  passwordSchema,
  gamePinSchema,
  nicknameSchema,
} from './primitives';
export { paginationQuerySchema } from './pagination';
export type { PaginationQuery } from './pagination';
export {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth';
export type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth';
