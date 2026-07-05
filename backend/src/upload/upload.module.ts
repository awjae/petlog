import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3UploadClient } from '@petlog/storage';
import { UploadController } from './upload.controller';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import {
  S3_UPLOAD_CLIENT,
  STORAGE_PROVIDER,
  type StorageProvider,
} from './storage-provider.interface';

@Module({
  controllers: [UploadController],
  providers: [
    LocalDiskStorageProvider,
    S3StorageProvider,
    // AiModule의 CHATGPT_CLIENT 팩토리와 동일한 패턴: 필요한 환경변수가
    // 모두 있을 때만 실제 클라이언트를 만들고, 없으면 null을 준다.
    {
      provide: S3_UPLOAD_CLIENT,
      useFactory: (config: ConfigService): S3UploadClient | null => {
        const bucket = config.get<string>('AWS_S3_BUCKET_NAME');
        const cloudfrontDomain = config.get<string>('AWS_CLOUDFRONT_DOMAIN');
        const region = config.get<string>('AWS_REGION');
        return bucket && cloudfrontDomain && region
          ? new S3UploadClient({ region, bucket, cloudfrontDomain })
          : null;
      },
      inject: [ConfigService],
    },
    // Local ↔ S3 중 어떤 구현체를 쓸지는 여기서 한 번만 결정한다.
    // UploadController는 StorageProvider 인터페이스만 알면 되고,
    // Provider 교체는 이 팩토리만 바꾸면 된다.
    // (AiModule의 HEALTH_REPORT_GENERATOR 팩토리와 동일한 패턴)
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        config: ConfigService,
        local: LocalDiskStorageProvider,
        s3: S3StorageProvider,
      ): StorageProvider => (config.get<string>('AWS_S3_BUCKET_NAME') ? s3 : local),
      inject: [ConfigService, LocalDiskStorageProvider, S3StorageProvider],
    },
  ],
})
export class UploadModule {}
