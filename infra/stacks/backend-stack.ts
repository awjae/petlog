import { Construct } from 'constructs';
import {
  TerraformStack,
  TerraformVariable,
  TerraformOutput,
  S3Backend,
  Fn,
  Token,
  propertyAccess,
} from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { ApprunnerService } from '../.gen/providers/aws/apprunner-service';
import { ApprunnerVpcConnector } from '../.gen/providers/aws/apprunner-vpc-connector';
import { IamRole } from '../.gen/providers/aws/iam-role';
import { IamRolePolicy } from '../.gen/providers/aws/iam-role-policy';
import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { SsmParameter } from '../.gen/providers/aws/ssm-parameter';
import { DataAwsSecretsmanagerSecretVersion } from '../.gen/providers/aws/data-aws-secretsmanager-secret-version';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { buildS3ReadWritePolicyDocument } from '../shared/s3-access-policy';
import {
  buildApprunnerAssumeRolePolicyDocument,
  createEcrAccessRole,
} from '../shared/apprunner-iam';
import { StorageStack } from './storage-stack';
import { RegistryStack } from './registry-stack';
import { NetworkStack } from './network-stack';
import { DatabaseStack, DB_MASTER_USERNAME, DB_NAME } from './database-stack';

export interface BackendStackProps {
  /** 배포 대상 환경. 서비스/역할/SSM 파라미터 네이밍에 사용한다. */
  readonly environment: Environment;
  /** S3 버킷/CloudFront cross-stack reference를 위해 storage-stack 인스턴스를 그대로 받는다. */
  readonly storageStack: StorageStack;
  /** ECR 이미지 URL cross-stack reference를 위해 registry-stack 인스턴스를 그대로 받는다. */
  readonly registryStack: RegistryStack;
  /**
   * App Runner VPC Connector용 private 서브넷/보안그룹 cross-stack reference를 위해
   * network-stack 인스턴스를 그대로 받는다.
   */
  readonly networkStack: NetworkStack;
  /** RDS 엔드포인트/DB 이름 cross-stack reference를 위해 database-stack 인스턴스를 그대로 받는다. */
  readonly databaseStack: DatabaseStack;
}

/**
 * NestJS 백엔드를 App Runner로 배포하는 스택 (Railway 완전 대체).
 *
 * ## ECS Fargate로 전환 시 이 파일만 바뀐다
 * `registry-stack`(ECR)과 storage-stack의 S3 접근 정책 "정의"(shared/s3-access-policy.ts)는
 * 컴퓨트 플랫폼과 무관하므로 그대로 재사용한다. 전환 시 바뀌는 것은:
 * - `ApprunnerService` → `EcsService`/`EcsTaskDefinition`(+ ALB, 보안그룹, VPC)
 * - Access Role → ECS Task Execution Role, Instance Role → ECS Task Role
 * - `runtimeEnvironmentVariables`/`Secrets` → 태스크 정의의 `environment`/`secrets` 필드
 * 자세한 표는 infra/README.md의 "ECS Fargate로 전환 시" 절 참고.
 */
export class BackendStack extends TerraformStack {
  public readonly service: ApprunnerService;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    const { environment, storageStack, registryStack, networkStack, databaseStack } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `backend-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: '백엔드 App Runner 서비스를 배포할 AWS 리전 (기본값: 서울)',
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

    // --- 시크릿 입력값 (실제 값은 코드에 없다) ---
    // 배포 시 `TF_VAR_jwt_secret`, `TF_VAR_refresh_token_secret` 환경변수로 주입한다.
    // default: ''는 오직 `synth`/`diff`가 비대화형으로 통과하도록 하기 위한 placeholder이며,
    // 빈 값으로 실제 `deploy`를 실행하면 안 된다.
    //
    // RDS 마스터 비밀번호는 여기서 TerraformVariable로 받지 않는다 — database-stack이
    // `manageMasterUserPassword: true`로 AWS 관리형 시크릿을 쓰므로, 아래 DATABASE_URL
    // 조립 단계에서 그 Secrets Manager 시크릿을 직접 읽어온다.
    const jwtSecret = new TerraformVariable(this, 'jwt_secret', {
      type: 'string',
      sensitive: true,
      default: '',
      description: 'JWT 서명 시크릿. TF_VAR_jwt_secret으로 주입.',
    });

    const refreshTokenSecret = new TerraformVariable(this, 'refresh_token_secret', {
      type: 'string',
      sensitive: true,
      default: '',
      description: 'Refresh Token 서명 시크릿. TF_VAR_refresh_token_secret으로 주입.',
    });

    // --- 순환 의존 처리 (backend의 FRONTEND_URL ↔ frontend의 NEXT_PUBLIC_API_URL) ---
    // frontend-stack이 이 스택의 서비스 URL을 cross-stack reference로 읽어야 하므로
    // backend-stack이 먼저 배포되어야 한다. 그런데 이 시점엔 frontend URL이 아직 없다.
    // 그래서 1차 배포는 이 변수를 비운 채(혹은 `*.awsapprunner.com` 패턴을 임시로 관대하게
    // 허용하는 CORS 설정으로) 배포하고, frontend-stack 배포로 실제 URL을 얻은 뒤 이 변수만
    // 채워서 backend-stack을 재배포한다 (2단계 배포). infra/README.md 참고.
    const frontendUrl = new TerraformVariable(this, 'frontend_url', {
      type: 'string',
      default: '',
      description:
        '허용할 프론트엔드 Origin (CORS). 1차 배포 시 비워두고, frontend-stack 배포 후 ' +
        '실제 URL로 채워 backend-stack만 재배포한다.',
    });

    const jwtExpiresIn = new TerraformVariable(this, 'jwt_expires_in', {
      type: 'string',
      default: '15m',
      description: 'Access Token 만료 기간 (backend/.env.example 기본값과 동일).',
    });

    const refreshTokenExpiresIn = new TerraformVariable(this, 'refresh_token_expires_in', {
      type: 'string',
      default: '30d',
      description: 'Refresh Token 만료 기간 (backend/.env.example 기본값과 동일).',
    });

    // --- DATABASE_URL 조립 (RDS 완전 이전, AWS 관리형 마스터 비밀번호 사용) ---
    // database-stack이 manageMasterUserPassword로 만든 Secrets Manager 시크릿을 읽어서
    // username/password를 꺼낸다. 이 데이터 소스는 `cdktf deploy`를 실행하는 주체(로컬
    // AWS 프로필 등)의 자격증명으로 조회되며, App Runner Instance Role의 권한과는 무관하다
    // (조립된 DATABASE_URL은 기존과 동일하게 SSM SecureString에 저장되고, 백엔드 컨테이너는
    // 그 SSM 파라미터만 읽으면 된다).
    const masterUserSecret = new DataAwsSecretsmanagerSecretVersion(this, 'db-master-secret', {
      secretId: databaseStack.instance.masterUserSecret.get(0).secretArn,
    });
    const masterUserSecretJson = Fn.jsondecode(masterUserSecret.secretString);
    // jsondecode()는 map을 나타내는 IResolvable 토큰을 돌려주므로, 그 안의 password 필드에
    // 접근하려면 propertyAccess로 표현식을 만들고 Token.asString으로 string 토큰으로 바꾼다.
    const masterPassword = Token.asString(propertyAccess(masterUserSecretJson, ['password']));

    // 비밀번호는 반드시 Fn.urlencode()로 퍼센트 인코딩한다. RDS 마스터 비밀번호에 `@`, `:`,
    // `/` 같은 문자가 하나라도 들어가면(AWS가 자동 생성하는 비밀번호는 특수문자를 포함한다),
    // URL 인코딩 없이 이어 붙일 경우 `@`가 여러 번 나타나 연결 문자열 파싱 자체가 깨진다
    // (예: postgresql://petlog:p@ss@<host>/petlog — 어디까지가 비밀번호인지 알 수 없어진다).
    const encodedPassword = Fn.urlencode(masterPassword);
    const databaseUrl =
      `postgresql://${DB_MASTER_USERNAME}:${encodedPassword}` +
      `@${databaseStack.instance.endpoint}/${DB_NAME}`;

    // --- SSM Parameter Store (SecureString) ---
    const databaseUrlParam = new SsmParameter(this, 'database-url-param', {
      name: `/petlog/${environment}/backend/database-url`,
      type: 'SecureString',
      value: databaseUrl,
    });

    const jwtSecretParam = new SsmParameter(this, 'jwt-secret-param', {
      name: `/petlog/${environment}/backend/jwt-secret`,
      type: 'SecureString',
      value: jwtSecret.stringValue,
    });

    const refreshTokenSecretParam = new SsmParameter(this, 'refresh-token-secret-param', {
      name: `/petlog/${environment}/backend/refresh-token-secret`,
      type: 'SecureString',
      value: refreshTokenSecret.stringValue,
    });

    // --- Access Role (build.apprunner.amazonaws.com, ECR pull 전용) ---
    const accessRole = createEcrAccessRole(
      this,
      'backend-access-role',
      `petlog-backend-access-role-${environment}`,
    );

    // --- Instance Role (tasks.apprunner.amazonaws.com, 런타임 권한) ---
    const instanceAssumeRolePolicy = buildApprunnerAssumeRolePolicyDocument(
      this,
      'backend-instance-assume-role-policy',
      'tasks.apprunner.amazonaws.com',
    );

    const instanceRole = new IamRole(this, 'backend-instance-role', {
      name: `petlog-backend-instance-role-${environment}`,
      assumeRolePolicy: instanceAssumeRolePolicy.json,
    });

    // S3 접근 권한: storage-stack이 만든 버킷을 cross-stack reference로 직접 참조한다.
    // 정의 자체는 storage-stack의 IAM User와 동일한 shared 함수를 재사용한다.
    const s3AccessPolicyDocument = buildS3ReadWritePolicyDocument(
      this,
      'backend-instance-s3-policy-document',
      storageStack.bucket.arn,
    );

    new IamRolePolicy(this, 'backend-instance-s3-policy', {
      name: `petlog-backend-s3-access-${environment}`,
      role: instanceRole.name,
      policy: s3AccessPolicyDocument.json,
    });

    // SSM 파라미터 읽기 권한: App Runner가 runtimeEnvironmentSecrets를 해석할 때 필요하다.
    const ssmAccessPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'backend-instance-ssm-policy-document',
      {
        statement: [
          {
            sid: 'AllowReadBackendSecrets',
            effect: 'Allow',
            actions: ['ssm:GetParameters'],
            resources: [databaseUrlParam.arn, jwtSecretParam.arn, refreshTokenSecretParam.arn],
          },
        ],
      },
    );

    new IamRolePolicy(this, 'backend-instance-ssm-policy', {
      name: `petlog-backend-ssm-access-${environment}`,
      role: instanceRole.name,
      policy: ssmAccessPolicyDocument.json,
    });

    // --- App Runner VPC Connector (private RDS 접근용) ---
    // App Runner 서비스는 기본적으로 VPC 밖에서 실행되므로, private 서브넷에만 있는 RDS에
    // 접근하려면 VPC Connector가 반드시 필요하다. network-stack의 private 서브넷 2개와
    // App Runner Connector 전용 보안그룹을 그대로 사용한다.
    const vpcConnector = new ApprunnerVpcConnector(this, 'backend-vpc-connector', {
      vpcConnectorName: `petlog-backend-vpc-connector-${environment}`,
      subnets: [networkStack.privateSubnets[0].id, networkStack.privateSubnets[1].id],
      securityGroups: [networkStack.apprunnerConnectorSecurityGroup.id],
    });

    // --- App Runner 서비스 ---
    this.service = new ApprunnerService(this, 'backend-service', {
      serviceName: `petlog-backend-${environment}`,
      instanceConfiguration: {
        // 개인 프로젝트 비용 최소화: App Runner 최소 사양 (0.25 vCPU / 0.5 GB).
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
        instanceRoleArn: instanceRole.arn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/api/health',
      },
      // RDS는 IAM이 아니라 네트워크 레벨(VPC Connector + 보안그룹) + DB 자체 인증(마스터 유저/
      // 비밀번호)으로 접근을 제어한다. 그래서 instanceRole에는 RDS 관련 권한을 추가하지 않는다.
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.arn,
        },
      },
      sourceConfiguration: {
        // ECR에 새 `latest` 이미지가 push되면 App Runner가 자동으로 재배포한다.
        // 별도 CI/CD 파이프라인 없이도 `docker push` 만으로 배포가 갱신된다.
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          accessRoleArn: accessRole.arn,
        },
        imageRepository: {
          imageIdentifier: `${registryStack.backendRepository.repositoryUrl}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '4000',
            runtimeEnvironmentVariables: {
              AWS_REGION: storageStack.awsRegion.stringValue,
              AWS_S3_BUCKET_NAME: storageStack.bucket.bucket,
              AWS_CLOUDFRONT_DOMAIN: storageStack.distribution.domainName,
              JWT_EXPIRES_IN: jwtExpiresIn.stringValue,
              REFRESH_TOKEN_EXPIRES_IN: refreshTokenExpiresIn.stringValue,
              NODE_ENV: 'production',
              FRONTEND_URL: frontendUrl.stringValue,
            },
            runtimeEnvironmentSecrets: {
              DATABASE_URL: databaseUrlParam.arn,
              JWT_SECRET: jwtSecretParam.arn,
              REFRESH_TOKEN_SECRET: refreshTokenSecretParam.arn,
            },
          },
        },
      },
    });

    new TerraformOutput(this, 'backend_service_url', {
      value: this.service.serviceUrl,
      description:
        '백엔드 App Runner 기본 도메인. frontend-stack의 NEXT_PUBLIC_API_URL이 참조한다 ' +
        '(https:// 접두사를 붙여서 사용).',
    });

    new TerraformOutput(this, 'backend_access_role_arn', {
      value: accessRole.arn,
      description: 'ECR pull용 Access Role ARN',
    });

    new TerraformOutput(this, 'backend_instance_role_arn', {
      value: instanceRole.arn,
      description: '런타임 Instance Role ARN (S3 + SSM 접근 권한)',
    });
  }
}
