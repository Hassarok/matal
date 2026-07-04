import type {
  ApiErrorCode,
  ApiResponse,
  HealthStatus,
} from '@matal/shared-types';
import { apiBaseUrl } from '../config/env';

/** Error thrown when the API returns a structured error envelope. */
export class ApiRequestError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Minimal typed fetch wrapper. Sends/receives JSON, includes credentials
 * (httpOnly auth cookies land here in Phase 2), and unwraps the platform's
 * `{ success, data }` envelope — throwing {@link ApiRequestError} on failure.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
  } catch {
    throw new ApiRequestError(
      'INTERNAL_ERROR',
      'Unable to reach the server. Please check your connection.',
    );
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!body) {
    throw new ApiRequestError('INTERNAL_ERROR', 'Malformed response from server.');
  }
  if (!body.success) {
    throw new ApiRequestError(body.error.code, body.error.message, body.error.details);
  }
  return body.data;
}

export const api = {
  health: () => request<HealthStatus>('/health'),
};
