import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Development email transport: prints the message (and, crucially, the action
 * link) to the API console so flows can be exercised without configuring an
 * email provider. Not for production use.
 */
@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger('Email');

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    this.print('Verify your email', to, verifyUrl);
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    this.print('Reset your password', to, resetUrl);
  }

  private print(subject: string, to: string, link: string): void {
    this.logger.log(
      `\n` +
        `┌─ [DEV EMAIL] ${subject}\n` +
        `│  To:   ${to}\n` +
        `│  Link: ${link}\n` +
        `└─ (Configure a real EmailService for production.)`,
    );
  }
}
