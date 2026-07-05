import { Global, Module } from '@nestjs/common';
import { DisabledStorageService, StorageService } from './storage.service';

/**
 * Global storage module. Binds {@link StorageService} to a disabled stub for
 * now (media is URL-based). Swap `useClass` for a local-disk or cloud
 * implementation later — no consumer changes required.
 */
@Global()
@Module({
  providers: [{ provide: StorageService, useClass: DisabledStorageService }],
  exports: [StorageService],
})
export class StorageModule {}
