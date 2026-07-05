import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { UsersModule } from '../users/users.module';

/**
 * Authentication feature module. JwtService/guards come from the global
 * AuthSecurityModule; PasswordService from the global SecurityModule; email
 * from the global EmailModule. Depends on UsersModule (one-directional).
 */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieService],
})
export class AuthModule {}
