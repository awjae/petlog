import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { S3Bucket } from '../.gen/providers/aws/s3-bucket';
import { S3BucketPublicAccessBlock } from '../.gen/providers/aws/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '../.gen/providers/aws/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '../.gen/providers/aws/s3-bucket-server-side-encryption-configuration';
import { DynamodbTable } from '../.gen/providers/aws/dynamodb-table';

import { DEFAULT_AWS_REGION, TERRAFORM_STATE_BUCKET, TERRAFORM_LOCK_TABLE } from '../config';

/**
 * Terraform remote state를 저장할 S3 버킷 + 락(lock)용 DynamoDB 테이블을 만드는
 * 부트스트랩 스택.
 *
 * 이 스택은 의도적으로 S3Backend를 쓰지 않는다(로컬 state). 이 스택이 만드는 바로 그
 * 버킷에 자기 자신의 state를 저장하려고 하면 순환 의존(닭이 먼저냐 달걀이 먼저냐)이
 * 생기기 때문이다. 최초 1회만 `cdktf deploy petlog-bootstrap`으로 실행하고, 이후
 * storage-stack 등 나머지 스택들은 이 스택이 만든 버킷/테이블을 S3Backend로 참조한다.
 *
 * 로컬 state 파일(`cdktf.out/stacks/petlog-bootstrap/terraform.tfstate`)은 git에
 * 커밋하지 않는다(.gitignore 참고). 이 스택은 거의 변경되지 않는 인프라라 로컬 state
 * 유실 리스크가 낮고, 유실되더라도 버킷/테이블이 실제로 존재하면
 * `terraform import`로 다시 상태를 가져올 수 있다.
 */
export class BootstrapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: DEFAULT_AWS_REGION });

    const stateBucket = new S3Bucket(this, 'terraform-state-bucket', {
      bucket: TERRAFORM_STATE_BUCKET,
    });

    new S3BucketPublicAccessBlock(this, 'terraform-state-bucket-public-access-block', {
      bucket: stateBucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketVersioningA(this, 'terraform-state-bucket-versioning', {
      bucket: stateBucket.bucket,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'terraform-state-bucket-encryption', {
      bucket: stateBucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // 온디맨드 과금이라 유휴 상태 고정비가 없다. LockID 1건짜리 락 테이블이라
    // 트래픽이 늘어도 사실상 무료 수준에서 크게 벗어나지 않는다.
    new DynamodbTable(this, 'terraform-lock-table', {
      name: TERRAFORM_LOCK_TABLE,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [{ name: 'LockID', type: 'S' }],
    });

    new TerraformOutput(this, 'state_bucket_name', { value: stateBucket.bucket });
    new TerraformOutput(this, 'lock_table_name', { value: TERRAFORM_LOCK_TABLE });
  }
}
