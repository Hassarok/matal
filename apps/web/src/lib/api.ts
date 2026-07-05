import type {
  ApiErrorCode,
  ApiResponse,
  HealthStatus,
  MessageResponse,
  PublicUser,
  SessionResponse,
} from '@matal/shared-types';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@matal/validation';
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
 * Silent refresh coordination: if a request 401s (expired access token) we try
 * the refresh endpoint once and replay the original request. Concurrent 401s
 * share a single in-flight refresh.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** Auth endpoints that must never trigger a silent refresh retry. */
function shouldTryRefresh(path: string): boolean {
  return !path.startsWith('/auth/') || path === '/auth/me';
}

async function request<T>(path: string, init?: RequestInit, allowRetry = true): Promise<T> {
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

  if (response.status === 401 && allowRetry && shouldTryRefresh(path)) {
    if (await refreshSession()) {
      return request<T>(path, init, false);
    }
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

function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export const api = {
  health: () => request<HealthStatus>('/health'),

  auth: {
    register: (input: RegisterInput) =>
      post<SessionResponse>('/auth/register', input).then((r) => r.user),
    login: (input: LoginInput) =>
      post<SessionResponse>('/auth/login', input).then((r) => r.user),
    logout: () => post<MessageResponse>('/auth/logout'),
    me: () => request<SessionResponse>('/auth/me').then((r) => r.user),
    verifyEmail: (token: string) =>
      post<MessageResponse>('/auth/verify-email', { token }),
    requestPasswordReset: (email: string) =>
      post<MessageResponse>('/auth/request-password-reset', { email }),
    resetPassword: (input: ResetPasswordInput) =>
      post<MessageResponse>('/auth/reset-password', input),
  },

  users: {
    updateProfile: (input: UpdateProfileInput) =>
      patch<PublicUser>('/users/me', input),
    changePassword: (input: ChangePasswordInput) =>
      post<MessageResponse>('/users/me/change-password', input),
  },
};
