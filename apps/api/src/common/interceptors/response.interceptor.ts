import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccess } from '@matal/shared-types';
import { map, Observable } from 'rxjs';

/**
 * Wraps every successful HTTP response in the platform's standard success
 * envelope: `{ success: true, data }`. Errors are handled separately by
 * {@link AllExceptionsFilter}. Only HTTP responses are transformed —
 * WebSocket messages pass through untouched.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccess<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<T> | T> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
