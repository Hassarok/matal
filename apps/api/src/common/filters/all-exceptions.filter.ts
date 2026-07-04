import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiError, ApiErrorCode } from '@matal/shared-types';
import type { Request, Response } from 'express';

/** Maps HTTP status codes to the platform's machine-readable error codes. */
const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

/**
 * Catches every unhandled exception and renders the platform's standard error
 * envelope: `{ success: false, error: { code, message, details? } }`.
 * Unexpected (non-HTTP) errors are logged and returned as a generic 500 so we
 * never leak stack traces or internal details to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Only HTTP is handled here; WS errors are dealt with in the gateway.
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code: ApiErrorCode =
      STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';

    let message = 'An unexpected error occurred.';
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const obj = payload as Record<string, unknown>;
        if (typeof obj.message === 'string') {
          message = obj.message;
        } else if (Array.isArray(obj.message)) {
          message = 'Validation failed.';
          details = { _: obj.message as string[] };
        }
        if (obj.details && typeof obj.details === 'object') {
          details = obj.details as Record<string, string[]>;
        }
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiError = {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    };

    response.status(status).json(body);
  }
}
