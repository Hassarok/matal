import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AppConfig } from '../../config/configuration';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Global auth primitives: the configured JwtService (access tokens) and the
 * reusable guards. Marked @Global so any feature module (Auth, Users, and
 * future ones) can protect routes without import wiring — and so Auth and
 * Users never need to import each other for guards.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('auth.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: config.get('auth.accessTtlSeconds', { infer: true }),
        },
      }),
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthSecurityModule {}
