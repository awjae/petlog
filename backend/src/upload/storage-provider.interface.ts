export interface StorageUploadResult {
  url: string;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
export const S3_UPLOAD_CLIENT = Symbol('S3_UPLOAD_CLIENT');

// Local ↔ S3 전환 시 이 인터페이스만 구현하면 되고, 어떤 구현체를 쓸지는
// UploadModule의 DI 팩토리(STORAGE_PROVIDER)가 결정한다. UploadController는
// 구현체를 알 필요가 없다.
export interface StorageProvider {
  upload(file: Buffer, key: string, mimetype: string): Promise<StorageUploadResult>;
}
