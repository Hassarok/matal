import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Admin panel: platform stats, user management and quiz moderation.
 * All routes are ADMIN-gated (see AdminController). JwtService comes from the
 * global AuthSecurityModule.
 */
@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
