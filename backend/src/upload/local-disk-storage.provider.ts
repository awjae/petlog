import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { StorageProvider, StorageUploadResult } from './storage-provider.interface';

// 로컬 개발 환경 기본값. AWS_S3_BUCKET_NAME이 없을 때 UploadModule의 팩토리가 이 구현체를 주입한다.
// main.ts의 app.useStaticAssets(.../uploads)가 이 디렉토리를 /api/uploads로 정적 서빙한다.
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async upload(file: Buffer, key: string): Promise<StorageUploadResult> {
    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(this.uploadDir, key), file);
    return { url: `/api/uploads/${key}` };
  }
}
