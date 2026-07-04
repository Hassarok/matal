import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates and transforms incoming request payloads against a Zod schema —
 * the very same schemas the web client uses (`@matal/validation`). On failure
 * it throws a 400 with structured, field-level details that flow through
 * {@link AllExceptionsFilter} into the standard error envelope.
 *
 * Usage: `@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto`
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const key = issue.path.join('.') || '_';
          (details[key] ??= []).push(issue.message);
        }
        throw new BadRequestException({ message: 'Validation failed.', details });
      }
      throw error;
    }
  }
}
