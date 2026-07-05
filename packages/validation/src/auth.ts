import { z } from 'zod';
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  usernameSchema,
} from './primitives';

/** Registration payload. */
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Login payload. Password isn't complexity-checked here — only presence. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Profile edit payload. */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  bio: z
    .string()
    .trim()
    .max(300, 'Bio must be at most 300 characters.')
    .optional()
    .or(z.literal('')),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Change-password payload. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Your current password is required.'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Request a password-reset email. */
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

/** Complete a password reset with a token. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Verify an email address with a token. */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required.'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
