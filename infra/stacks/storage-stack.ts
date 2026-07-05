import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { S3Bucket } from '../.gen/providers/aws/s3-bucket';
import { S3BucketPublicAccessBlock } from '../.gen/providers/aws/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '../.gen/providers/aws/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '../.gen/providers/aws/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '../.gen/providers/aws/s3-bucket-lifecycle-configuration';
import { S3BucketPolicy } from '../.gen/providers/aws/s3-bucket-policy';
import { CloudfrontOriginAccessControl } from '../.gen/providers/aws/cloudfront-origin-access-control';
import { CloudfrontDistribution } from '../.gen/providers/aws/cloudfront-distribution';
import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { IamUser } from '../.gen/providers/aws/iam-user';
import { IamUserPolicy } from '../.gen/providers/aws/iam-user-policy';
import { IamAccessKey } from '../.gen/providers/aws/iam-access-key';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { buildS3ReadWritePolicyDocument } from '../shared/s3-access-policy';

export interface StorageStackProps {
  /** 배포 대상 환경. 버킷/IAM 리소스 네이밍(`petlog-uploads-{env}`)에 사용한다. */
  readonly environment: Environment;
}

/**
 * 이미지 업로드용 S3 + CloudFront(OAC) + 백엔드 IAM 스택.
 *
 * 아키텍처 계약 (반드시 유지):
 * - S3 버킷은 Block Public Access를 전체 차단한 완전 private 버킷이다.
 *   퍼블릭 버킷 정책이나 ACL로 직접 공개하지 않는다.
 * - 공개 서빙은 CloudFront + Origin Access Control(OAC)로만 한다.
 * - 백엔드(NestJS, backend-stack의 ECS Fargate로 호스팅)가 참조할 값은 다음 3가지로 고정한다.
 *   - AWS_REGION
 *   - AWS_S3_BUCKET_NAME
 *   - AWS_CLOUDFRONT_DOMAIN
 *   이 이름들은 backend-architect 쪽 StorageProvider 구현체와 계약이므로 임의로 바꾸지 않는다.
 *
 * 다른 스택(backend-stack 등)이 이 스택의 리소스를 cross-stack reference로 직접 참조할 수
 * 있도록 버킷/리전 변수/배포(distribution)를 public readonly로 노출한다. CDKTF는 두 스택이
 * 모두 remote state(S3Backend)를 쓰는 한, 참조하는 쪽 스택에 자동으로
 * `terraform_remote_state` 데이터소스를 생성해 값을 읽어온다 — 수동으로 output을 파싱할
 * 필요가 없다.
 */
export class StorageStack extends TerraformStack {
  public readonly bucket: S3Bucket;
  public readonly awsRegion: TerraformVariable;
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    const { environment } = props;

    // --- Remote state (S3 backend + DynamoDB lock) ---
    // 이 버킷/테이블 자체는 CDKTF가 관리하지 않는다. infra/README.md의 부트스트랩
    // 절차로 미리 수동 생성되어 있어야 한다 (순환 의존 방지).
    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `storage-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: 'S3 / CloudFront 리소스를 배포할 AWS 리전 (기본값: 서울)',
    });
    this.awsRegion = awsRegion;

    new AwsProvider(this, 'aws', {
      region: awsRegion.stringValue,
      defaultTags: [
        {
          tags: {
            Project: 'petlog',
            Environment: environment,
            ManagedBy: 'cdktf',
          },
        },
      ],
    });

    const bucketName = `petlog-uploads-${environment}`;

    // --- S3 버킷 (완전 private) ---
    const bucket = new S3Bucket(this, 'uploads-bucket', {
      bucket: bucketName,
    });
    this.bucket = bucket;

    // Block Public Access 4개 항목 전체 차단.
    new S3BucketPublicAccessBlock(this, 'uploads-bucket-public-access-block', {
      bucket: bucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // 실수로 덮어쓰거나 삭제해도 이전 버전으로 복구할 수 있도록 버저닝을 켠다.
    // 대신 아래 lifecycle 규칙으로 오래된 버전은 비용 관리 차원에서 자동 정리한다.
    new S3BucketVersioningA(this, 'uploads-bucket-versioning', {
      bucket: bucket.bucket,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // 기본 서버 측 암호화 (SSE-S3). 별도 KMS 키 비용 없이 저장 데이터를 암호화한다.
    new S3BucketServerSideEncryptionConfigurationA(this, 'uploads-bucket-encryption', {
      bucket: bucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // 비용 가드레일: 미완료 멀티파트 업로드는 7일 후 정리, 버저닝으로 쌓이는
    // 이전 버전 객체는 30일 후 만료시켜 스토리지 비용이 무한정 누적되지 않게 한다.
    new S3BucketLifecycleConfiguration(this, 'uploads-bucket-lifecycle', {
      bucket: bucket.bucket,
      rule: [
        {
          id: 'abort-incomplete-multipart-uploads',
          status: 'Enabled',
          filter: [{ prefix: '' }],
          abortIncompleteMultipartUpload: [{ daysAfterInitiation: 7 }],
        },
        {
          id: 'expire-noncurrent-versions',
          status: 'Enabled',
          filter: [{ prefix: '' }],
          noncurrentVersionExpiration: [{ noncurrentDays: 30 }],
        },
      ],
    });

    // --- CloudFront + Origin Access Control ---
    const oac = new CloudfrontOriginAccessControl(this, 'uploads-oac', {
      name: `petlog-uploads-${environment}-oac`,
      description: `Petlog ${environment} 업로드 버킷 전용 OAC`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // 관리형 캐시 정책 "CachingOptimized" ID (모든 AWS 계정/리전 공통 고정값).
    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
    const CACHING_OPTIMIZED_POLICY_ID = '658327ea-f89d-4fab-a63d-7e88639e58f6';

    const distribution = new CloudfrontDistribution(this, 'uploads-distribution', {
      enabled: true,
      comment: `Petlog ${environment} 업로드 이미지 배포`,
      // 개인 포트폴리오 프로젝트 비용 최소화: PriceClass_100은 북미/유럽 엣지 로케이션만
      // 사용해 가장 저렴하다. 한국 사용자 응답속도가 중요해지면 PriceClass_200(아시아 포함,
      // 비용 상승)으로 변경을 검토한다.
      priceClass: 'PriceClass_100',
      isIpv6Enabled: true,
      origin: [
        {
          originId: 's3-uploads-origin',
          domainName: bucket.bucketRegionalDomainName,
          originAccessControlId: oac.id,
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 's3-uploads-origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        cachePolicyId: CACHING_OPTIMIZED_POLICY_ID,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      viewerCertificate: {
        // 커스텀 도메인 없이 기본 *.cloudfront.net 도메인만 사용한다 (ACM/Route53 불필요).
        cloudfrontDefaultCertificate: true,
      },
    });
    this.distribution = distribution;

    // CloudFront(OAC)만 GetObject 할 수 있도록 허용하고, 그 외 모든 접근은 차단한다.
    // SourceArn 조건으로 "이 배포"에서 온 요청만 허용해 다른 CloudFront 배포가
    // 이 버킷을 오용하는 confused-deputy 공격을 막는다.
    const bucketPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'uploads-bucket-policy-document',
      {
        statement: [
          {
            sid: 'AllowCloudFrontServicePrincipalReadOnly',
            effect: 'Allow',
            actions: ['s3:GetObject'],
            resources: [`${bucket.arn}/*`],
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudfront.amazonaws.com'],
              },
            ],
            condition: [
              {
                test: 'StringEquals',
                variable: 'AWS:SourceArn',
                values: [distribution.arn],
              },
            ],
          },
        ],
      },
    );

    new S3BucketPolicy(this, 'uploads-bucket-policy', {
      bucket: bucket.bucket,
      policy: bucketPolicyDocument.json,
    });

    // --- 백엔드(NestJS)용 최소 권한 IAM (레거시: Railway 시절 워크어라운드) ---
    // 백엔드가 Railway(AWS 외부)에서 호스팅되던 시절에는 IAM Role을 assume할 수 없어
    // 정적 액세스 키를 발급하는 IAM User가 유일한 방법이었다. 이제 backend-stack이
    // ECS Task Role(임시 자격증명, 키 rotate 불필요)로 완전히 대체했으므로
    // 이 IAM User/Access Key는 더 이상 애플리케이션 코드에서 쓰이지 않는다.
    // Railway → ECS Fargate 완전 전환이 실제 트래픽으로 검증되면
    // 이 블록(backendUser/backendAccessKey)과 관련 output은 별도 변경으로 제거를 검토한다
    // (지금 당장 지우지 않는 이유: 롤백 여유를 남겨두기 위함 — infra/README.md 참고).
    // 권한 "정의"는 shared/s3-access-policy.ts에서 가져온다. ECS Task Role
    // (backend-stack)도 이 동일한 정의를 재사용한다 — "어떤 권한이 필요한지"와 "누구에게
    // 붙일지"를 분리하는 원칙에 따라, 이 파일에서는 IAM User에 붙이는 것만 담당한다.
    const backendPolicyDocument = buildS3ReadWritePolicyDocument(
      this,
      'backend-uploader-policy-document',
      bucket.arn,
    );

    const backendUser = new IamUser(this, 'backend-uploader-user', {
      name: `petlog-backend-uploader-${environment}`,
      path: '/petlog/',
    });

    new IamUserPolicy(this, 'backend-uploader-policy', {
      name: `petlog-s3-uploads-${environment}`,
      user: backendUser.name,
      policy: backendPolicyDocument.json,
    });

    const backendAccessKey = new IamAccessKey(this, 'backend-uploader-access-key', {
      user: backendUser.name,
    });

    // --- Outputs ---
    // 백엔드 환경변수 계약: AWS_REGION / AWS_S3_BUCKET_NAME / AWS_CLOUDFRONT_DOMAIN
    new TerraformOutput(this, 'output_aws_region', {
      value: awsRegion.stringValue,
      description: '백엔드 AWS_REGION 환경변수 값',
    });

    new TerraformOutput(this, 'aws_s3_bucket_name', {
      value: bucket.bucket,
      description: '백엔드 AWS_S3_BUCKET_NAME 환경변수 값',
    });

    new TerraformOutput(this, 'aws_cloudfront_domain', {
      value: distribution.domainName,
      description: '백엔드 AWS_CLOUDFRONT_DOMAIN 환경변수 값 (이미지 최종 URL 조립에 사용)',
    });

    new TerraformOutput(this, 'backend_iam_access_key_id', {
      value: backendAccessKey.id,
      description: '백엔드가 S3에 접근할 때 사용할 IAM Access Key ID',
      sensitive: true,
    });

    new TerraformOutput(this, 'backend_iam_secret_access_key', {
      value: backendAccessKey.secret,
      description:
        '백엔드가 S3에 접근할 때 사용할 IAM Secret Access Key. ' +
        '반드시 Secrets Manager/SSM 또는 Railway 환경변수로 즉시 이전하고, ' +
        '평문으로 커밋하거나 로그에 남기지 말 것.',
      sensitive: true,
    });
  }
}
