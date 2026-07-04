import { z } from 'zod';

/**
 * Reusable field-level schemas. Centralising these guarantees the API and
 * the web client enforce identical rules — no drift between front and back.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Please enter a valid email address.');

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(24, 'Username must be at most 24 characters.')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username may only contain letters, numbers and underscores.',
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required.')
  .max(50, 'Display name must be at most 50 characters.');

/**
 * Strong-but-humane password policy: length is the dominant strength factor,
 * with a light complexity requirement to avoid trivially weak passwords.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[0-9]/, 'Include at least one number.');

/** Live-game join PIN — 6 digits. */
export const gamePinSchema = z
  .string()
  .regex(/^[0-9]{6}$/, 'Game PIN must be 6 digits.');

/** Player nickname used inside a live game. */
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, 'Nickname is required.')
  .max(20, 'Nickname must be at most 20 characters.');
