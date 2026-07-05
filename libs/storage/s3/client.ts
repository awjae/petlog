import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface S3UploadClientConfig {
  region: string;
  bucket: string;
  cloudfrontDomain: string;
}

export interface S3UploadResult {
  url: string;
}

// S3 버킷은 private이고 CloudFront OAC로만 공개되므로, 반환 URL은
// 항상 CloudFront 도메인을 기준으로 조립한다. S3 리전 URL을 직접 반환하지 않는다.
export class S3UploadClient {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontDomain: string;

  constructor(config: S3UploadClientConfig) {
    this.client = new S3Client({ region: config.region });
    this.bucket = config.bucket;
    this.cloudfrontDomain = config.cloudfrontDomain;
  }

  async upload(file: Buffer, key: string, mimetype: string): Promise<S3UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimetype,
      }),
    );
    return { url: `https://${this.cloudfrontDomain}/${key}` };
  }
}
