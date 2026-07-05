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
import { Alb } from '../.gen/providers/aws/alb';
import { AlbListener } from '../.gen/providers/aws/alb-listener';
import { AlbListenerRule } from '../.gen/providers/aws/alb-listener-rule';
import { AlbTargetGroup } from '../.gen/providers/aws/alb-target-group';
import { EcsCluster } from '../.gen/providers/aws/ecs-cluster';
import { EcsTaskDefinition } from '../.gen/providers/aws/ecs-task-definition';
import { EcsService } from '../.gen/providers/aws/ecs-service';
import { CloudwatchLogGroup } from '../.gen/providers/aws/cloudwatch-log-group';
import { IamRolePolicy } from '../.gen/providers/aws/iam-role-policy';
import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { DataAwsKmsAlias } from '../.gen/providers/aws/data-aws-kms-alias';
import { SsmParameter } from '../.gen/providers/aws/ssm-parameter';
import { DataAwsSecretsmanagerSecretVersion } from '../.gen/providers/aws/data-aws-secretsmanager-secret-version';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { buildS3ReadWritePolicyDocument } from '../shared/s3-access-policy';
import { createEcsTaskExecutionRole, createEcsTaskRole } from '../shared/ecs-iam';
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
   * ALB/ECS 태스크가 배치될 public 서브넷, 보안그룹 cross-stack reference를 위해
   * network-stack 인스턴스를 그대로 받는다.
   */
  readonly networkStack: NetworkStack;
  /** RDS 엔드포인트/DB 이름 cross-stack reference를 위해 database-stack 인스턴스를 그대로 받는다. */
  readonly databaseStack: DatabaseStack;
}

/**
 * NestJS 백엔드를 ECS Fargate로 배포하는 스택 (Railway 완전 대체, App Runner에서 재전환).
 *
 * ## 왜 App Runner에서 ECS Fargate로 전환했는가
 * App Runner는 서울 리전(ap-northeast-2)을 지원하지 않는다는 사실을 이번 세션에서 DNS/CLI로
 * 직접 확인했다. 즉 App Runner 기반 이전 구현은 실제로는 한 번도 배포에 성공한 적이 없다.
 * 서울 리전을 유지해야 하므로(RDS/S3/CloudFront가 이미 서울에 있음) ECS Fargate + ALB로 바꿨다.
 *
 * ## ALB를 backend/frontend가 공유하는 이유
 * 서비스마다 ALB를 하나씩 만들면 ALB 시간당 고정비가 2배가 된다. 이 스택이 ALB 1개를
 * 만들고, 경로 기반 라우팅으로 `/api/*`는 backend 타겟 그룹, 그 외 전부는 frontend 타겟
 * 그룹으로 보낸다. **frontend 타겟 그룹도 이 스택(backend-stack)에서 만든다** — ALB의
 * 리스너(기본 액션 포함)를 소유하는 스택이 모든 타겟 그룹을 만들어야 리스너 규칙을
 * 일관되게 정의할 수 있기 때문이다. `frontend-stack`은 이 타겟 그룹의 ARN을 cross-stack
 * reference로 받아 자신의 ECS 서비스만 등록한다.
 *
 * ## 순환 의존이 사라진 이유
 * App Runner 때는 backend/frontend가 서로 다른 기본 도메인을 가져서 `FRONTEND_URL`(CORS)과
 * `NEXT_PUBLIC_API_URL`이 서로를 참조하는 순환 의존과 2단계 배포가 필요했다. 이제 ALB
 * 하나를 공유하므로 이 둘 다 "이 ALB의 DNS 이름" 하나로 충분하다 — ALB는 이 스택
 * 배포가 끝나는 즉시 DNS 이름을 알 수 있으므로 frontend-stack 배포를 기다릴 필요가 없다.
 */
export class BackendStack extends TerraformStack {
  public readonly cluster: EcsCluster;
  public readonly alb: Alb;
  public readonly albListener: AlbListener;
  public readonly frontendTargetGroup: AlbTargetGroup;
  /** ALB DNS 이름 기반 접속 URL. FRONTEND_URL/NEXT_PUBLIC_API_URL이 동일하게 이 값을 참조한다. */
  public readonly albUrl: string;

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
      description: '백엔드 ECS Fargate 서비스를 배포할 AWS 리전 (기본값: 서울)',
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
    // AWS 프로필 등)의 자격증명으로 조회되며, ECS Task Execution/Task Role의 권한과는 무관하다
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

    // --- ALB (backend/frontend 공유) ---
    const alb = new Alb(this, 'alb', {
      name: `petlog-alb-${environment}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [networkStack.albSecurityGroup.id],
      subnets: [networkStack.publicSubnets[0].id, networkStack.publicSubnets[1].id],
      // 개인 프로젝트: 삭제 보호를 켜지 않는다 (dev 환경 destroy를 쉽게 유지).
      enableDeletionProtection: false,
    });
    this.alb = alb;

    // 커스텀 도메인/ACM 인증서가 없으므로 http:// 접두사만 사용한다 (storage-stack의
    // CloudFront와 동일한 "인증서 없음" 원칙). FRONTEND_URL과 NEXT_PUBLIC_API_URL 둘 다
    // 이 값 하나를 그대로 참조한다.
    const albUrl = `http://${alb.dnsName}`;
    this.albUrl = albUrl;

    const backendTargetGroup = new AlbTargetGroup(this, 'backend-target-group', {
      name: `petlog-backend-tg-${environment}`,
      port: 4000,
      protocol: 'HTTP',
      vpcId: networkStack.vpc.id,
      // Fargate awsvpc 네트워크 모드는 반드시 targetType 'ip'를 써야 한다 (인스턴스 ID가 없다).
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/api/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
    });

    // frontend 타겟 그룹도 이 스택에서 만든다 (위 클래스 주석 참고). 헬스체크 경로는
    // `/api/health`가 아니라 반드시 `/`다 — ALB 리스너 규칙상 `/api/*`는 항상 backend로 먼저
    // 라우팅되므로, frontend 컨테이너의 `/api/health` 라우트는 이 ALB를 통해서는 도달 불가능하다.
    const frontendTargetGroup = new AlbTargetGroup(this, 'frontend-target-group', {
      name: `petlog-frontend-tg-${environment}`,
      port: 3000,
      protocol: 'HTTP',
      vpcId: networkStack.vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
    });
    this.frontendTargetGroup = frontendTargetGroup;

    // 포트 80(HTTP)만 연다 — 커스텀 도메인/ACM 인증서가 없으므로 HTTPS는 범위 밖이다.
    // 기본 액션(default action)은 frontend로 보낸다. `/api/*` 경로만 아래 리스너 규칙으로
    // backend에 먼저 매칭시킨다(ALB는 우선순위가 낮은 숫자의 규칙부터 평가하고, 매칭되는
    // 규칙이 없으면 이 기본 액션으로 떨어진다).
    const albListener = new AlbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: frontendTargetGroup.arn,
        },
      ],
    });
    this.albListener = albListener;

    new AlbListenerRule(this, 'backend-path-rule', {
      listenerArn: albListener.arn,
      priority: 1,
      condition: [
        {
          pathPattern: { values: ['/api/*'] },
        },
      ],
      action: [
        {
          type: 'forward',
          targetGroupArn: backendTargetGroup.arn,
        },
      ],
    });

    // --- ECS 클러스터 (backend/frontend 공유) ---
    const cluster = new EcsCluster(this, 'cluster', {
      name: `petlog-cluster-${environment}`,
    });
    this.cluster = cluster;

    // --- CloudWatch Logs ---
    // ECS는 App Runner와 달리 로그 그룹을 명시적으로 만들어야 한다. 개인 프로젝트 비용
    // 억제를 위해 보관 기간을 짧게(7일) 잡는다.
    const backendLogGroup = new CloudwatchLogGroup(this, 'backend-log-group', {
      name: `/ecs/petlog-backend-${environment}`,
      retentionInDays: 7,
    });

    // --- IAM: Task Execution Role (ECR pull + CloudWatch Logs, App Runner Access Role 대체) ---
    const executionRole = createEcsTaskExecutionRole(
      this,
      'backend-execution-role',
      `petlog-backend-execution-role-${environment}`,
    );

    // 컨테이너 정의의 `secrets` 필드가 SSM SecureString을 참조하려면 Execution Role에
    // ssm:GetParameters 권한이 필요하다 (관리형 정책 AmazonECSTaskExecutionRolePolicy에는
    // 포함되어 있지 않다). SecureString은 KMS로 암호화되어 있으므로 kms:Decrypt도 함께
    // 필요하다 — SsmParameter가 keyId를 지정하지 않아 기본 AWS 관리형 키(alias/aws/ssm)를
    // 쓰므로, 그 키의 실제 ARN을 데이터 소스로 조회해 최소 권한으로 범위를 좁힌다(`*` 금지).
    const ssmDefaultKey = new DataAwsKmsAlias(this, 'ssm-default-kms-alias', {
      name: 'alias/aws/ssm',
    });

    const executionSsmPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'backend-execution-ssm-policy-document',
      {
        statement: [
          {
            sid: 'AllowReadBackendSecrets',
            effect: 'Allow',
            actions: ['ssm:GetParameters'],
            resources: [databaseUrlParam.arn, jwtSecretParam.arn, refreshTokenSecretParam.arn],
          },
          {
            sid: 'AllowDecryptBackendSecrets',
            effect: 'Allow',
            actions: ['kms:Decrypt'],
            resources: [ssmDefaultKey.targetKeyArn],
          },
        ],
      },
    );

    new IamRolePolicy(this, 'backend-execution-ssm-policy', {
      name: `petlog-backend-ssm-access-${environment}`,
      role: executionRole.name,
      policy: executionSsmPolicyDocument.json,
    });

    // --- IAM: Task Role (런타임 S3 접근, App Runner Instance Role 대체) ---
    const taskRole = createEcsTaskRole(
      this,
      'backend-task-role',
      `petlog-backend-task-role-${environment}`,
    );

    // S3 접근 권한: storage-stack이 만든 버킷을 cross-stack reference로 직접 참조한다.
    // 정의 자체는 storage-stack의 IAM User와 동일한 shared 함수를 재사용한다.
    const s3AccessPolicyDocument = buildS3ReadWritePolicyDocument(
      this,
      'backend-task-s3-policy-document',
      storageStack.bucket.arn,
    );

    new IamRolePolicy(this, 'backend-task-s3-policy', {
      name: `petlog-backend-s3-access-${environment}`,
      role: taskRole.name,
      policy: s3AccessPolicyDocument.json,
    });

    // RDS는 IAM이 아니라 네트워크 레벨(보안그룹) + DB 자체 인증(마스터 유저/비밀번호)으로
    // 접근을 제어한다. 그래서 taskRole에는 RDS 관련 권한을 추가하지 않는다.

    // --- ECS Task Definition ---
    // 개인 프로젝트 비용 최소화: Fargate 최소 사양 (256 CPU units / 512 MiB).
    const backendTaskDefinition = new EcsTaskDefinition(this, 'backend-task-definition', {
      family: `petlog-backend-${environment}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      // Docker 이미지가 Apple Silicon(ARM64)에서 빌드되므로 Fargate 기본값(x86_64)과 맞지
      // 않아 "exec format error"로 컨테이너가 즉시 죽는다. ARM64로 명시한다 — 다시 빌드할
      // 필요도 없고, Graviton 기반이라 x86_64보다 비용도 더 저렴하다.
      runtimePlatform: {
        cpuArchitecture: 'ARM64',
        operatingSystemFamily: 'LINUX',
      },
      containerDefinitions: JSON.stringify([
        {
          name: 'backend',
          image: `${registryStack.backendRepository.repositoryUrl}:latest`,
          essential: true,
          portMappings: [{ containerPort: 4000, protocol: 'tcp' }],
          environment: [
            { name: 'AWS_REGION', value: storageStack.awsRegion.stringValue },
            { name: 'AWS_S3_BUCKET_NAME', value: storageStack.bucket.bucket },
            { name: 'AWS_CLOUDFRONT_DOMAIN', value: storageStack.distribution.domainName },
            { name: 'JWT_EXPIRES_IN', value: jwtExpiresIn.stringValue },
            { name: 'REFRESH_TOKEN_EXPIRES_IN', value: refreshTokenExpiresIn.stringValue },
            { name: 'NODE_ENV', value: 'production' },
            // 더 이상 별도 변수로 2단계 배포하지 않는다 — ALB를 backend/frontend가 공유하므로
            // frontend도 결국 이 ALB 도메인으로 접속한다.
            { name: 'FRONTEND_URL', value: albUrl },
          ],
          secrets: [
            { name: 'DATABASE_URL', valueFrom: databaseUrlParam.arn },
            { name: 'JWT_SECRET', valueFrom: jwtSecretParam.arn },
            { name: 'REFRESH_TOKEN_SECRET', valueFrom: refreshTokenSecretParam.arn },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': backendLogGroup.name,
              'awslogs-region': awsRegion.stringValue,
              'awslogs-stream-prefix': 'backend',
            },
          },
        },
      ]),
    });

    // --- ECS Service ---
    // public 서브넷 + assignPublicIp: true로 NAT Gateway 없이 아웃바운드 인터넷(ECR pull,
    // SSM, Secrets Manager, S3 API 호출)을 확보한다. 인바운드는 ecsTaskSecurityGroup이
    // ALB에서 오는 4000 포트만 허용하므로 사실상 "public 서브넷에 있지만 인바운드는 ALB로만
    // 제한"되는 구조다 (network-stack.ts 클래스 주석 참고).
    new EcsService(this, 'backend-service', {
      name: `petlog-backend-${environment}`,
      cluster: cluster.id,
      taskDefinition: backendTaskDefinition.arn,
      desiredCount: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [networkStack.publicSubnets[0].id, networkStack.publicSubnets[1].id],
        securityGroups: [networkStack.ecsTaskSecurityGroup.id],
        assignPublicIp: true,
      },
      loadBalancer: [
        {
          targetGroupArn: backendTargetGroup.arn,
          containerName: 'backend',
          containerPort: 4000,
        },
      ],
      healthCheckGracePeriodSeconds: 30,
      // ECS 서비스가 타겟 그룹에 태스크를 등록하려면 리스너가 먼저 존재해야 한다
      // (AWS 공식 권고 — 그렇지 않으면 "Unable to add target" 류의 경쟁 상태가 생길 수 있다).
      dependsOn: [albListener],
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.dnsName,
      description: 'ALB의 원시 DNS 이름 (http:// 접두사 없음).',
    });

    new TerraformOutput(this, 'alb_url', {
      value: albUrl,
      description:
        '백엔드(`/api/*`)와 프론트엔드(그 외 전부)가 공유하는 접속 URL. ' +
        'frontend-stack의 NEXT_PUBLIC_API_URL 빌드 인자가 이 값을 그대로 참조한다.',
    });

    new TerraformOutput(this, 'backend_execution_role_arn', {
      value: executionRole.arn,
      description: 'ECR pull + CloudWatch Logs용 Task Execution Role ARN',
    });

    new TerraformOutput(this, 'backend_task_role_arn', {
      value: taskRole.arn,
      description: '런타임 Task Role ARN (S3 접근 권한)',
    });
  }
}
