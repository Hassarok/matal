import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiRequestError } from '@/lib/api';

/**
 * Maps an API error onto a react-hook-form. Field-level details become inline
 * field errors; a friendly summary message is returned for a form-level alert.
 * Technical/backend details are never surfaced to the user.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (error instanceof ApiRequestError) {
    if (error.details) {
      for (const [field, messages] of Object.entries(error.details)) {
        if (field !== '_' && messages.length > 0) {
          setError(field as Path<T>, { type: 'server', message: messages[0] });
        }
      }
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
