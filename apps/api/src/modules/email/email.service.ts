/**
 * Email delivery abstraction. Consumers depend on this class as a DI token,
 * never on a concrete transport. Today the only implementation logs to the
 * console (see {@link ConsoleEmailService}); an SMTP/provider implementation
 * can be added later and bound in `EmailModule` with zero consumer changes.
 */
export abstract class EmailService {
  abstract sendVerificationEmail(to: string, verifyUrl: string): Promise<void>;
  abstract sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
}
