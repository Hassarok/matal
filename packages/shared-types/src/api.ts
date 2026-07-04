/**
 * Transport-level contracts shared by every API endpoint.
 * A consistent envelope keeps client-side handling uniform and predictable.
 */

/** Standard success envelope returned by the API. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Machine-readable error codes surfaced to the client. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/** Standard error envelope returned by the API. */
export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    /** Optional field-level validation details, keyed by field path. */
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Cursor/offset pagination metadata. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Paginated collection payload. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
