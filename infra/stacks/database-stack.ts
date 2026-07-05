import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { DbSubnetGroup } from '../.gen/providers/aws/db-subnet-group';
import { DbInstance } from '../.gen/providers/aws/db-instance';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { NetworkStack } from './network-stack';

export interface DatabaseStackProps {
  /** 배포 대상 환경. RDS 인스턴스/서브넷 그룹 네이밍과 skipFinalSnapshot 분기에 사용한다. */
  readonly environment: Environment;
  /** private 서브넷/RDS 보안그룹 cross-stack reference를 위해 network-stack 인스턴스를 그대로 받는다. */
  readonly networkStack: NetworkStack;
}

/** RDS 마스터 유저네임과 DB 이름. backend-stack의 연결 문자열 조립과 값이 반드시 일치해야 한다. */
export const DB_MASTER_USERNAME = 'petlog';
export const DB_NAME = 'petlog';

/**
 * Railway managed PostgreSQL을 완전히 대체하는 RDS PostgreSQL 스택.
 *
 * ## 개인 프로젝트 비용 가드레일
 * - `db.t4g.micro`(Graviton, 프리티어 대상), `gp3` 20GB, **Single-AZ**(Multi-AZ 아님).
 * - dev 환경은 `skipFinalSnapshot: true`로 destroy를 빠르게 하고, prod는 `false`로 삭제 시
 *   반드시 최종 스냅샷을 남긴다.
 * - 백업 보관 기간은 7일로 짧게 잡아(Railway 대비 과도하지 않게) 스토리지 비용을 억제한다.
 *
 * ## 마스터 비밀번호는 RDS 관리형 시크릿(`manageMasterUserPassword`)을 쓴다
 * 사람이 비밀번호를 정해서 `TF_VAR_*`로 넘기지 않는다. AWS가 비밀번호를 직접 생성해
 * Secrets Manager에 저장하고 필요 시 로테이션까지 관리해준다 — 비밀번호가 Terraform state나
 * 셸 히스토리에 평문으로 남지 않는다. `backend-stack.ts`가 이 시크릿의 ARN을
 * cross-stack reference로 받아 `DataAwsSecretsmanagerSecretVersion`으로 읽고,
 * `username`/`password` 필드를 꺼내 DATABASE_URL을 조립한다.
 */
export class DatabaseStack extends TerraformStack {
  public readonly instance: DbInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const { environment, networkStack } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `database-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: 'RDS 인스턴스를 배포할 AWS 리전 (기본값: 서울)',
    });

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

    // --- DB Subnet Group (network-stack의 private 서브넷 2개) ---
    const subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `petlog-db-subnet-group-${environment}`,
      description: 'RDS PostgreSQL용 서브넷 그룹 (network-stack의 private 서브넷 2개)',
      subnetIds: [networkStack.privateSubnets[0].id, networkStack.privateSubnets[1].id],
    });

    // --- RDS PostgreSQL 인스턴스 ---
    const instance = new DbInstance(this, 'db-instance', {
      identifier: `petlog-db-${environment}`,
      engine: 'postgres',
      engineVersion: '16',
      instanceClass: 'db.t4g.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      multiAz: false,
      publiclyAccessible: false,
      dbName: DB_NAME,
      username: DB_MASTER_USERNAME,
      manageMasterUserPassword: true,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [networkStack.rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      // dev는 빠른 destroy를 위해 최종 스냅샷을 생략하고, prod는 삭제 시 반드시 스냅샷을 남긴다.
      skipFinalSnapshot: environment === 'dev',
      finalSnapshotIdentifier:
        environment === 'prod' ? `petlog-db-${environment}-final-snapshot` : undefined,
      applyImmediately: environment === 'dev',
    });
    this.instance = instance;

    // --- Outputs ---
    new TerraformOutput(this, 'db_endpoint', {
      value: instance.endpoint,
      description: 'RDS 엔드포인트 (host:port 형태). backend-stack의 연결 문자열 조립에 사용.',
    });

    new TerraformOutput(this, 'db_address', {
      value: instance.address,
      description: 'RDS 호스트 이름만 (포트 제외).',
    });

    new TerraformOutput(this, 'db_name', {
      value: instance.dbName,
      description: 'RDS 데이터베이스 이름 (petlog 고정).',
    });

    new TerraformOutput(this, 'db_master_user_secret_arn', {
      value: instance.masterUserSecret.get(0).secretArn,
      description:
        'AWS가 관리하는 마스터 비밀번호가 저장된 Secrets Manager 시크릿 ARN. ' +
        'backend-stack이 이 값을 읽어 DATABASE_URL을 조립한다.',
    });
  }
}
