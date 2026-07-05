import { Inject, Injectable } from '@nestjs/common';
import type { S3UploadClient } from '@petlog/storage';
import {
  S3_UPLOAD_CLIENT,
  type StorageProvider,
  type StorageUploadResult,
} from './storage-provider.interface';

// 프로덕션 환경 구현체. AWS_S3_BUCKET_NAME 등이 설정되어 있으면 UploadModule의
// 팩토리가 이 구현체를 주입한다. 실제 S3 SDK 호출은 @petlog/storage의
// S3UploadClient(라이브러리)가 담당하고, 이 클래스는 NestJS DI 경계 역할만 한다.
@Injectable()
export class S3StorageProvider implements StorageProvider {
  constructor(@Inject(S3_UPLOAD_CLIENT) private readonly client: S3UploadClient | null) {}

  async upload(file: Buffer, key: string, mimetype: string): Promise<StorageUploadResult> {
    if (!this.client) {
      // UploadModule의 STORAGE_PROVIDER 팩토리가 AWS_S3_BUCKET_NAME 존재 여부로
      // 이 구현체를 선택하므로, 정상 흐름에서는 도달하지 않는다.
      throw new Error('S3 클라이언트가 설정되지 않았습니다 (AWS_S3_BUCKET_NAME 등 누락).');
    }
    return this.client.upload(file, key, mimetype);
  }
}
