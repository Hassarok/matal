import { ServiceUnavailableException } from '@nestjs/common';

export interface StoredFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * File storage abstraction (future-readiness seam). Media is referenced by URL
 * today, so no consumer uploads yet — but this contract exists so a local-disk
 * or S3/R2 implementation can be added later and bound in `StorageModule`
 * without touching quiz/media code.
 */
export abstract class StorageService {
  /** Persists a file and returns its public URL. */
  abstract save(file: StoredFile): Promise<string>;
}

/** Default binding: uploads are disabled; callers should pass image URLs. */
export class DisabledStorageService extends StorageService {
  async save(): Promise<string> {
    throw new ServiceUnavailableException(
      'File uploads are not enabled on this deployment. Provide an image URL instead.',
    );
  }
}
