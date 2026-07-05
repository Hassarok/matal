import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing with Argon2id. Parameters use the library defaults, which
 * follow current OWASP guidance. Verification never throws — a malformed or
 * mismatched hash simply returns false.
 */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return hash(plain);
  }

  async verify(hashed: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashed, plain);
    } catch {
      return false;
    }
  }
}
