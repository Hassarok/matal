import { Global, Module } from '@nestjs/common';
import { PasswordService } from './password.service';

/**
 * Global security primitives (password hashing today; room for more later).
 * Marked @Global so any module can inject them without wiring imports and
 * without creating circular dependencies between Auth and Users.
 */
@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class SecurityModule {}
