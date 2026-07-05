import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConsoleEmailService } from './console-email.service';

/**
 * Global email module. Binds the {@link EmailService} contract to the
 * console transport for now — swap `useClass` for an SMTP/provider
 * implementation later without touching any consumer.
 */
@Global()
@Module({
  providers: [{ provide: EmailService, useClass: ConsoleEmailService }],
  exports: [EmailService],
})
export class EmailModule {}
