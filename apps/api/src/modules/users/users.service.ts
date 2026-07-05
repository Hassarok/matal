import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { PublicUser } from '@matal/shared-types';
import type { UpdateProfileInput } from '@matal/validation';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../security/password.service';
import { toPublicUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return toPublicUser(user);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        displayName: input.displayName,
        // Empty string clears the bio; undefined leaves it unchanged.
        bio: input.bio === '' ? null : (input.bio ?? undefined),
      },
    });
    return toPublicUser(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const valid = await this.passwords.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new BadRequestException('Your current password is incorrect.');
    }

    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });

    // Invalidate all refresh sessions so other devices must sign in again.
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
