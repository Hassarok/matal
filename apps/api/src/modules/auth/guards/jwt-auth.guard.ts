import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_COOKIE, type AuthenticatedUser, type JwtPayload } from '../auth.types';

/**
 * Authenticates a request from the access-token cookie. On success it attaches
 * the principal (`{ id, role }`) to `request.user`; otherwise it throws 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser; cookies?: Record<string, string> }>();

    const token = request.cookies?.[ACCESS_COOKIE];
    if (!token) {
      throw new UnauthorizedException('You must be signed in to do that.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
  }
}
