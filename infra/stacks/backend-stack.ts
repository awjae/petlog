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
import { AcmCertificate } from '../.gen/providers/aws/acm-certificate';
import { Alb } from '../.gen/providers/aws/alb';
import { AlbListener } from '../.gen/providers/aws/alb-listener';
import { AlbListenerRule } from '../.gen/providers/aws/alb-listener-rule';
import { AlbTargetGroup } from '../.gen/providers/aws/alb-target-group';
import { CloudfrontDistribution } from '../.gen/providers/aws/cloudfront-distribution';
import { EcsCluster } from '../.gen/providers/aws/ecs-cluster';
import { EcsTaskDefinition } from '../.gen/providers/aws/ecs-task-definition';
import { EcsService } from '../.gen/providers/aws/ecs-service';
import { CloudwatchLogGroup } from '../.gen/providers/aws/cloudwatch-log-group';
import { IamRolePolicy } from '../.gen/providers/aws/iam-role-policy';
import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { DataAwsKmsAlias } from '../.gen/providers/aws/data-aws-kms-alias';
import { DataAwsCallerIdentity } from '../.gen/providers/aws/data-aws-caller-identity';
import { Sesv2EmailIdentity } from '../.gen/providers/aws/sesv2-email-identity';
import { SsmParameter } from '../.gen/providers/aws/ssm-parameter';
import { DataAwsSecretsmanagerSecretVersion } from '../.gen/providers/aws/data-aws-secretsmanager-secret-version';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { buildS3ReadWritePolicyDocument } from '../shared/s3-access-policy';
import { buildSesSendPolicyDocument } from '../shared/ses-access-policy';
import { createEcsTaskExecutionRole, createEcsTaskRole } from '../shared/ecs-iam';
import { StorageStack } from './storage-stack';
import { RegistryStack } from './registry-stack';
import { NetworkStack } from './network-stack';
import { DatabaseStack, DB_MASTER_USERNAME, DB_NAME } from './database-stack';

/**
 * SES 콘솔에서 자동 생성된 기본 설정 세트 이름. Identity에 붙은 값과 IAM 정책의 리소스
 * ARN 두 곳에서 같은 값을 써야 하므로(불일치 시 발송이 AccessDenied로 실패) 상수로 둔다.
 * 콘솔에 이미 붙어있던 값과 달라지면 다음 apply에서 되돌려버리므로 실제 값을 그대로 맞춘다.
 */
const MAIL_CONFIGURATION_SET_NAME = 'my-first-configuration-set';

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
 *
 * ## CloudFront를 이 스택이 소유하는 이유 (ALB HTTPS 지원)
 * ALB는 `*.elb.amazonaws.com` 도메인이라 ACM 인증서를 발급받을 수 없다(AWS가 자기 소유
 * 도메인에는 인증서를 내주지 않는다). 그래서 커스텀 도메인을 새로 사는 대신, storage-stack의
 * 이미지 CloudFront와 동일한 원칙으로 CloudFront의 기본 `*.cloudfront.net` 도메인에 자동으로
 * 붙는 무료 TLS 인증서를 활용한다(`.claude/docs/decisions/020-cloudfront-https.md` 참고).
 * ALB를 소유한 이 스택이 CloudFront도 함께 관리하는 것이 자연스럽다. storage-stack의
 * CloudFront와 달리 이번 배포는 **캐싱을 하지 않는다** — 이 앱은 정적 자산이 아니라
 * 로그인 세션이 있는 동적 API/웹 서버라, 사용자마다 다른 응답을 캐시하면 안 되기 때문이다.
 */
export class BackendStack extends TerraformStack {
  public readonly cluster: EcsCluster;
  public readonly alb: Alb;
  public readonly albListener: AlbListener;
  public readonly frontendTargetGroup: AlbTargetGroup;
  /** ALB DNS 이름 기반 접속 URL (http://, CloudFront 오리진 전용). 더 이상 FRONTEND_URL/
   * NEXT_PUBLIC_API_URL이 참조하지 않는다 — 대신 `cloudfrontUrl`을 참조한다. */
  public readonly albUrl: string;
  /** ALB 앞단 CloudFront 배포. HTTPS 종단 + 캐싱 비활성화(동적 API/세션 대응). */
  public readonly cloudfrontDistribution: CloudfrontDistribution;
  /** CloudFront 기본 도메인 기반 접속 URL (https://). FRONTEND_URL/NEXT_PUBLIC_API_URL이
   * 동일하게 이 값을 참조한다. */
  public readonly cloudfrontUrl: string;

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

    // 빈 값이면 backend/src/ai/ai.module.ts의 HEALTH_REPORT_GENERATOR 팩토리가 자동으로
    // Mock generator로 폴백한다(로컬 .env와 동일 계약) — 배포 자체가 이 값 없이도 항상
    // 성공해야 하므로 default: ''를 유지한다. 실제 AI 리포트를 내보내려면 배포 전 반드시
    // TF_VAR_openai_api_key를 주입해야 한다.
    const openaiApiKey = new TerraformVariable(this, 'openai_api_key', {
      type: 'string',
      sensitive: true,
      default: '',
      description:
        'OpenAI API 키. 비어있으면 HEALTH_REPORT_GENERATOR가 Mock으로 폴백한다. TF_VAR_openai_api_key로 주입.',
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

    // 메일 발송 여부는 기본값을 'mock'(미발송)으로 둔다 — 배포 자체는 항상 성공해야 하고,
    // 실제 발송(ses)은 TF_VAR_mail_provider를 명시적으로 'ses'로 줄 때만 켜진다
    // (backend/.env.example의 MAIL_PROVIDER 스위치와 동일한 계약).
    const mailProvider = new TerraformVariable(this, 'mail_provider', {
      type: 'string',
      default: 'mock',
      description: "메일 발송 Provider. 'ses'로 주입해야 실제 발송된다 (TF_VAR_mail_provider).",
    });

    // SES 발신 도메인. 도메인 단위로 Verified Identity를 등록하면(콘솔에서 DNS 검증, CDKTF가
    // 대신할 수 없음) 이 도메인의 모든 발신 주소가 개별 검증 없이 허용된다 — 아래 mailFromAddress는
    // 이 도메인에 속하는 주소이기만 하면 되고, 그 자체가 별도 identity일 필요는 없다.
    const mailFromDomain = new TerraformVariable(this, 'mail_from_domain', {
      type: 'string',
      default: '',
      description:
        'SES에 도메인 단위로 Verified Identity를 등록한 발신 도메인(예: petlog.quest). ' +
        'TF_VAR_mail_from_domain으로 주입.',
    });

    // Sesv2EmailIdentity는 mailProvider와 무관하게 항상 생성되므로(리소스를 count로 조건부화하면
    // 주소가 `[0]`으로 바뀌어 import 절차가 더 복잡해진다), 실제 발송을 켠 경우에 도메인이
    // 비어있지 않은지를 plan 단계에서 막는다.
    mailFromDomain.addValidation({
      condition: '${var.mail_provider != "ses" || var.mail_from_domain != ""}',
      errorMessage:
        'mail_provider=ses로 배포하려면 mail_from_domain을 반드시 채워야 한다 — ' +
        '비워두면 SES Identity가 빈 문자열로 생성되려 해서 apply가 실패한다.',
    });

    // 실제 발신 헤더(Source)에 쓰이는 주소. mailFromDomain이 검증된 도메인이면 이 주소는
    // 그 도메인에 속하기만 하면 되므로 별도 IAM 리소스 범위 지정에는 쓰이지 않는다.
    //
    // 다만 두 값이 독립적으로 주입되므로, 주소가 검증된 도메인에 속하지 않으면 SES가 발송을
    // 거부한다. 그리고 auth.service의 requestPasswordReset은 enumeration 방지를 위해 발송
    // 실패를 삼키므로(Sentry로는 보고되지만 사용자에게는 항상 200), 이 오설정은 사용자
    // 경험 실패로만 드러난다 — 그래서 배포 시점(plan)에 미리 막는다.
    const mailFromAddress = new TerraformVariable(this, 'mail_from_address', {
      type: 'string',
      default: '',
      description:
        'ECS 컨테이너의 MAIL_FROM_ADDRESS로 주입되는 발신 이메일 주소. ' +
        'mail_from_domain에 속하는 주소여야 한다(예: noreply@petlog.quest). ' +
        'TF_VAR_mail_from_address로 주입.',
    });

    // 변수 자신을 참조해야 하므로 생성 후에 붙인다. 둘 중 하나라도 비어있으면(= mock
    // provider 경로) 검사를 건너뛰고, 둘 다 채워진 경우에만 주소가 "@<도메인>"으로 끝나는지
    // 확인한다. (다른 변수를 참조하는 validation은 Terraform 1.9+ 필요 — infra/README.md 참고)
    mailFromAddress.addValidation({
      // Op.eq(x, '')/Op.eq(x, 0)은 cdktf 0.21이 우변 falsy 값을 흘려버려 `== undefined`로
      // 렌더된다(synth 출력으로 확인). 유효한 Terraform이 아니므로 조건식은 HCL로 직접 쓴다.
      condition:
        '${var.mail_from_address == "" || var.mail_from_domain == "" ||' +
        ' endswith(var.mail_from_address, "@${var.mail_from_domain}")}',
      errorMessage:
        'mail_from_address는 mail_from_domain에 속하는 주소여야 한다 ' +
        '(예: domain=petlog.quest → address=noreply@petlog.quest). ' +
        '불일치하면 SES가 발송을 거부하고, 그 실패는 비밀번호 재설정 응답에서 드러나지 않는다.',
    });

    // CloudFront에 붙일 커스텀 도메인. ACM 인증서 발급 시점의 DNS 검증(레코드 등록)은
    // CDKTF가 대신할 수 없으므로(사람이 Route53/도메인 등록기관에서 처리) 이미 검증 완료된
    // 도메인을 그대로 반영만 한다 — domain-name 값 자체는 비밀이 아니지만, 이 스택만
    // 봐서는 어떤 도메인을 쓰는지 알 수 없게(코드-설정 분리) TF_VAR로 주입한다.
    const domainName = new TerraformVariable(this, 'domain_name', {
      type: 'string',
      default: '',
      description:
        'CloudFront에 연결할 커스텀 도메인 (ACM 인증서와 동일해야 함). TF_VAR_domain_name으로 주입.',
    });

    // 기본값을 빈 문자열로 두는 이유는 mail_provider와 동일하다 — 배포 자체는 항상 성공해야
    // 하고, Sentry 초기화는 TF_VAR_backend_sentry_dsn을 명시적으로 줄 때만 켜진다
    // (backend/src/instrument.ts의 `if (dsn)` 가드와 동일한 계약, backend/.env.example의 로컬
    // 기본값과도 동일). backend/frontend가 서로 다른 Sentry DSN을 쓰므로(별도 프로젝트),
    // frontend-stack.ts의 sentry_dsn 변수와 이름을 다르게 둔다 — 둘 다 TF_VAR_sentry_dsn을
    // 쓰면 deploy.sh처럼 같은 셸 세션에서 두 스택을 연달아 배포할 때 값이 서로 새어 들어간다.
    const sentryDsn = new TerraformVariable(this, 'backend_sentry_dsn', {
      type: 'string',
      default: '',
      description:
        '백엔드용 Sentry DSN. 비어있으면 Sentry를 초기화하지 않는다. TF_VAR_backend_sentry_dsn으로 주입.',
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
    // 주의: 이 파라미터는 **마스터 자격증명**이며 DB 롤 부트스트랩 태스크만 사용한다.
    // 백엔드 런타임과 마이그레이션은 각각 아래의 `-app` / `-migrator` 파라미터를 쓴다
    // (이름만 보고 런타임용이라고 착각하기 쉬워 description에도 같은 내용을 남긴다).
    const databaseUrlParam = new SsmParameter(this, 'database-url-param', {
      name: `/petlog/${environment}/backend/database-url`,
      type: 'SecureString',
      value: databaseUrl,
      description:
        'RDS 마스터 자격증명 (7일마다 자동 로테이션). DB 롤 부트스트랩 태스크 전용 — ' +
        '백엔드 런타임은 database-url-app, 마이그레이션은 database-url-migrator를 사용한다.',
    });

    // --- 애플리케이션 전용 DB 롤 파라미터 (terraform이 값을 관리하지 않는다) ---
    // `petlog_app` / `petlog_migrator`의 접속 URL은 `infra/scripts/bootstrap-db-roles.sh`가
    // VPC 내부 일회성 태스크로 생성해 SSM에 직접 저장한다. terraform은 값을 읽지도 쓰지도
    // 않고 ARN만 참조한다 — 그래서 이 비밀번호들은 terraform state에 평문으로 남지 않는다
    // (마스터 비밀번호가 state에 들어가는 기존 구조보다 나은 지점이다).
    //
    // 값을 읽지 않으므로 DataAwsSsmParameter 대신 ARN을 직접 조립한다. 데이터 소스로 읽으면
    // 부트스트랩 전에는 plan 자체가 실패해 "배포 → 부트스트랩" 순서를 잡을 수 없다.
    const callerIdentity = new DataAwsCallerIdentity(this, 'current-caller-identity', {});
    const ssmParameterArn = (parameterName: string): string =>
      `arn:aws:ssm:${awsRegion.stringValue}:${callerIdentity.accountId}:parameter${parameterName}`;

    const appDatabaseUrlParamName = `/petlog/${environment}/backend/database-url-app`;
    const migratorDatabaseUrlParamName = `/petlog/${environment}/backend/database-url-migrator`;
    const appDatabaseUrlParamArn = ssmParameterArn(appDatabaseUrlParamName);
    const migratorDatabaseUrlParamArn = ssmParameterArn(migratorDatabaseUrlParamName);

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

    const openaiApiKeyParam = new SsmParameter(this, 'openai-api-key-param', {
      name: `/petlog/${environment}/backend/openai-api-key`,
      type: 'SecureString',
      value: openaiApiKey.stringValue,
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

    // --- CloudFront (ALB 앞단 HTTPS 종단) ---
    // AWS 관리형 캐시 정책 "CachingDisabled" ID (모든 AWS 계정/리전 공통 고정값). storage-stack의
    // CachingOptimized와 달리, 이 배포는 min/default/max TTL이 전부 0으로 고정된 이 정책을 써서
    // 캐싱을 사실상 끈다 — 로그인한 사용자마다 다른 응답이 나와야 하는 동적 API/세션 서버이기
    // 때문이다 (storage-stack의 이미지 CloudFront는 정적 콘텐츠라 캐싱해도 안전하지만 이번엔 다름).
    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
    const CACHING_DISABLED_POLICY_ID = '4135ea2d-6df8-44a3-9df3-4b5a84be39ad';

    // AWS 관리형 오리진 요청 정책 "Managed-AllViewerExceptHostHeader" ID (고정값). 쿠키/헤더/
    // 쿼리스트링을 전부 오리진(ALB)까지 그대로 전달한다 — 로그인 쿠키와 GraphQL 쿼리 파라미터가
    // 백엔드까지 도달해야 하므로 필수다. Host 헤더만 제외하는 이유는 오리진이 ALB DNS 이름을
    // 기대하는데 뷰어의 Host 헤더(CloudFront 도메인)를 그대로 넘기면 ALB 라우팅이 깨질 수 있어서다.
    const ALL_VIEWER_EXCEPT_HOST_HEADER_ORIGIN_REQUEST_POLICY_ID =
      'b689b0a8-53d0-40ab-baf2-68738e2966ac';

    // CloudFront에 붙일 ACM 인증서: 요청하는 CloudFront 배포가 어느 리전에 있든, CloudFront용
    // ACM 인증서는 반드시 us-east-1이어야 한다(AWS의 고정 제약). 이 스택의 기본 AwsProvider는
    // ap-northeast-2로 구성되어 있으므로, 별도 provider 블록 없이 리소스 단위 `region`
    // override(AWS Provider v5.4+ 기능)로 us-east-1을 지정한다.
    // DNS 검증(도메인 등록기관/Route53에 CNAME 추가)은 사람이 이미 완료한 상태를
    // 그대로 가져온 것 — CDKTF가 검증 자체를 수행하지 않으므로 별도의
    // `AcmCertificateValidation` 리소스는 두지 않는다.
    const certificate = new AcmCertificate(this, 'domain-certificate', {
      domainName: domainName.stringValue,
      validationMethod: 'DNS',
      region: 'us-east-1',
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    const cloudfrontDistribution = new CloudfrontDistribution(this, 'alb-distribution', {
      enabled: true,
      comment: `Petlog ${environment} 백엔드/프론트엔드 공유 ALB HTTPS 종단`,
      // 개인 포트폴리오 프로젝트 비용 최소화 원칙(storage-stack과 동일): PriceClass_100은
      // 북미/유럽 엣지 로케이션만 사용해 가장 저렴하다.
      priceClass: 'PriceClass_100',
      isIpv6Enabled: true,
      origin: [
        {
          originId: 'shared-alb-origin',
          domainName: alb.dnsName,
          customOriginConfig: {
            // ALB에는 HTTPS 리스너가 없다(포트 80만 존재) — 오리진 프로토콜은 http-only로
            // 고정한다. CloudFront→ALB 구간은 AWS 내부망이라 평문이어도 실사용자에게
            // 노출되지 않는다.
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: 'http-only',
            originSslProtocols: ['TLSv1.2'],
          },
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 'shared-alb-origin',
        // 뷰어가 HTTP로 접속해도 강제로 HTTPS로 리다이렉트한다 — 로그인 토큰/건강 데이터가
        // 평문으로 오가지 않도록 하는 것이 이번 변경의 목적이다.
        viewerProtocolPolicy: 'redirect-to-https',
        // API 서버이므로 쓰기 요청(PUT/POST/PATCH/DELETE)도 전부 통과해야 한다. storage-stack의
        // 이미지 CloudFront는 GET/HEAD만 허용했지만 이번엔 다르다.
        allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        cachePolicyId: CACHING_DISABLED_POLICY_ID,
        originRequestPolicyId: ALL_VIEWER_EXCEPT_HOST_HEADER_ORIGIN_REQUEST_POLICY_ID,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      aliases: [domainName.stringValue],
      viewerCertificate: {
        acmCertificateArn: certificate.arn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      },
    });
    this.cloudfrontDistribution = cloudfrontDistribution;

    const cloudfrontUrl = `https://${cloudfrontDistribution.domainName}`;
    this.cloudfrontUrl = cloudfrontUrl;

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
            resources: [
              // 마스터 — 부트스트랩 태스크 전용
              databaseUrlParam.arn,
              // 런타임/마이그레이션이 각각 주입받는 애플리케이션 롤 자격증명
              appDatabaseUrlParamArn,
              migratorDatabaseUrlParamArn,
              jwtSecretParam.arn,
              refreshTokenSecretParam.arn,
              openaiApiKeyParam.arn,
            ],
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

    // SES Identity(도메인 단위): 콘솔에서 수동으로 DNS 검증을 완료한 도메인 Identity를
    // 그대로 가져온다 (`cdktf import`). 도메인 소유권 확인(DNS 레코드 추가)은 CDKTF가 대신할
    // 수 없으므로 이미 완료된 상태를 반영만 한다 — configurationSetName은 콘솔에서 이미
    // 붙어있던 값과 다르면 다음 apply에서 되돌려버리므로 실제 값을 그대로 맞춘다.
    const mailIdentity = new Sesv2EmailIdentity(this, 'mail-domain-identity', {
      emailIdentity: mailFromDomain.stringValue,
      configurationSetName: MAIL_CONFIGURATION_SET_NAME,
    });

    // 설정 세트는 Identity와 마찬가지로 콘솔에서 만들어진 실물이라 여기서 리소스로 관리하지
    // 않는다(이벤트 대상 없이 ReputationMetricsEnabled만 켜진 상태). 그래서 ARN도 데이터
    // 소스가 아니라 계정/리전/이름으로 직접 조립한다.
    const mailConfigurationSetArn = `arn:aws:ses:${awsRegion.stringValue}:${callerIdentity.accountId}:configuration-set/${MAIL_CONFIGURATION_SET_NAME}`;

    // SES 발송 권한: Identity 자체는 위에서 가져왔으니, 그 Identity로 보낼 수 있는 IAM
    // 권한을 taskRole에 부착해야 실제 배포 환경(ECS)에서 발송이 동작한다.
    const sesAccessPolicyDocument = buildSesSendPolicyDocument(
      this,
      'backend-task-ses-policy-document',
      mailIdentity.arn,
      mailConfigurationSetArn,
    );

    new IamRolePolicy(this, 'backend-task-ses-policy', {
      name: `petlog-backend-ses-access-${environment}`,
      role: taskRole.name,
      policy: sesAccessPolicyDocument.json,
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
            // frontend도 결국 같은 도메인으로 접속한다. CloudFront 추가 이후로는 ALB URL이 아니라
            // CloudFront 도메인(HTTPS)을 참조한다 — 사용자에게 노출되는 최종 접속 경로이기 때문이다.
            { name: 'FRONTEND_URL', value: cloudfrontUrl },
            { name: 'MAIL_PROVIDER', value: mailProvider.stringValue },
            { name: 'MAIL_FROM_ADDRESS', value: mailFromAddress.stringValue },
            { name: 'SENTRY_DSN', value: sentryDsn.stringValue },
          ],
          secrets: [
            // 런타임은 마스터가 아니라 `petlog_app` 롤로 접속한다. 이 롤의 비밀번호는 AWS가
            // 로테이션하지 않으므로, 마스터 비밀번호가 7일마다 바뀌어도 영향받지 않는다.
            { name: 'DATABASE_URL', valueFrom: appDatabaseUrlParamArn },
            { name: 'JWT_SECRET', valueFrom: jwtSecretParam.arn },
            { name: 'REFRESH_TOKEN_SECRET', valueFrom: refreshTokenSecretParam.arn },
            { name: 'OPENAI_API_KEY', valueFrom: openaiApiKeyParam.arn },
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

    // --- 마이그레이션 전용 태스크 정의 ---
    // 예전에는 `migrate-deploy-ecs.sh`가 backend 서비스의 태스크 정의를 그대로 재사용해
    // 커맨드만 오버라이드했다. 런타임이 `petlog_app`(DML 전용)으로 바뀌면서 그 방식으로는
    // DDL 권한이 없어 `prisma migrate deploy`가 실패한다. 마이그레이션은 스키마 객체를
    // 소유한 `petlog_migrator`로 접속해야 하므로 태스크 정의를 분리한다.
    //
    // 정의를 나눈 덕분에 런타임 태스크에는 migrator 자격증명이 아예 실리지 않는다 —
    // 같은 정의에 두 URL을 다 심고 커맨드에서 갈아끼우는 방식보다 경계가 명확하다.
    const migrateTaskDefinition = new EcsTaskDefinition(this, 'backend-migrate-task-definition', {
      family: `petlog-backend-migrate-${environment}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      runtimePlatform: {
        cpuArchitecture: 'ARM64',
        operatingSystemFamily: 'LINUX',
      },
      containerDefinitions: JSON.stringify([
        {
          name: 'migrate',
          image: `${registryStack.backendRepository.repositoryUrl}:latest`,
          essential: true,
          // 항상 `run-task --overrides`로 커맨드를 지정해 쓴다. 오버라이드를 깜빡하면
          // 조용히 API 서버가 뜨는 대신 즉시 실패하도록 기본 커맨드를 막아둔다.
          command: ['sh', '-c', 'echo "command 오버라이드가 필요한 태스크입니다"; exit 1'],
          secrets: [{ name: 'DATABASE_URL', valueFrom: migratorDatabaseUrlParamArn }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': backendLogGroup.name,
              'awslogs-region': awsRegion.stringValue,
              'awslogs-stream-prefix': 'migrate',
            },
          },
        },
      ]),
    });

    // --- DB 롤 부트스트랩 전용 태스크 정의 ---
    // `petlog_app` / `petlog_migrator` 롤을 만들려면 마스터 자격증명이 필요하다. 이 태스크만
    // 마스터를 주입받고, 생성한 비밀번호를 자기 손으로 SSM에 저장한다
    // (`infra/scripts/bootstrap-db-roles.sh` 참고 — 비밀번호가 로컬이나 CloudTrail에
    // 남지 않게 하려는 설계다).
    const bootstrapLogGroup = new CloudwatchLogGroup(this, 'db-bootstrap-log-group', {
      name: `/ecs/petlog-db-bootstrap-${environment}`,
      retentionInDays: 7,
    });

    const bootstrapTaskRole = createEcsTaskRole(
      this,
      'db-bootstrap-task-role',
      `petlog-db-bootstrap-task-role-${environment}`,
    );

    const bootstrapTaskPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'db-bootstrap-task-policy-document',
      {
        statement: [
          {
            sid: 'AllowWriteAppDatabaseUrls',
            effect: 'Allow',
            actions: ['ssm:PutParameter'],
            // 이 태스크가 쓸 수 있는 파라미터를 딱 두 개로 못박는다.
            resources: [appDatabaseUrlParamArn, migratorDatabaseUrlParamArn],
          },
          {
            sid: 'AllowEncryptSsmSecureString',
            effect: 'Allow',
            // SecureString으로 저장하려면 SSM 기본 KMS 키에 대한 암호화 권한이 필요하다.
            actions: ['kms:Encrypt', 'kms:GenerateDataKey'],
            resources: [ssmDefaultKey.targetKeyArn],
          },
        ],
      },
    );

    new IamRolePolicy(this, 'db-bootstrap-task-policy', {
      name: `petlog-db-bootstrap-ssm-write-${environment}`,
      role: bootstrapTaskRole.name,
      policy: bootstrapTaskPolicyDocument.json,
    });

    const bootstrapTaskDefinition = new EcsTaskDefinition(this, 'db-bootstrap-task-definition', {
      family: `petlog-db-bootstrap-${environment}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: bootstrapTaskRole.arn,
      runtimePlatform: {
        cpuArchitecture: 'ARM64',
        operatingSystemFamily: 'LINUX',
      },
      containerDefinitions: JSON.stringify([
        {
          name: 'bootstrap',
          image: `${registryStack.backendRepository.repositoryUrl}:latest`,
          essential: true,
          command: ['sh', '-c', 'echo "command 오버라이드가 필요한 태스크입니다"; exit 1'],
          environment: [{ name: 'AWS_REGION', value: awsRegion.stringValue }],
          secrets: [{ name: 'DATABASE_URL', valueFrom: databaseUrlParam.arn }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': bootstrapLogGroup.name,
              'awslogs-region': awsRegion.stringValue,
              'awslogs-stream-prefix': 'bootstrap',
            },
          },
        },
      ]),
    });

    new TerraformOutput(this, 'migrate_task_definition_family', {
      value: migrateTaskDefinition.family,
      description:
        'prisma migrate deploy 전용 태스크 정의 이름. backend/scripts/migrate-deploy-ecs.sh가 사용한다.',
    });

    new TerraformOutput(this, 'db_bootstrap_task_definition_family', {
      value: bootstrapTaskDefinition.family,
      description:
        'DB 롤 부트스트랩 전용 태스크 정의 이름. infra/scripts/bootstrap-db-roles.sh가 사용한다.',
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.dnsName,
      description: 'ALB의 원시 DNS 이름 (http:// 접두사 없음). CloudFront의 오리진으로만 쓰인다.',
    });

    new TerraformOutput(this, 'alb_url', {
      value: albUrl,
      description:
        'ALB DNS 이름 기반 접속 URL (http://, CloudFront 오리진 전용 참고용). ' +
        '더 이상 FRONTEND_URL/NEXT_PUBLIC_API_URL이 참조하지 않는다 — `cloudfront_url`을 쓴다. ' +
        'ALB 보안그룹이 CloudFront 오리진 IP 대역만 허용하므로 이 URL로 직접 접속은 되지 않는다.',
    });

    new TerraformOutput(this, 'cloudfront_url', {
      value: cloudfrontUrl,
      description:
        '백엔드(`/api/*`)와 프론트엔드(그 외 전부)가 공유하는 HTTPS 접속 URL(https:// 포함). ' +
        'frontend-stack의 NEXT_PUBLIC_API_URL 빌드 인자와 backend-stack의 FRONTEND_URL ' +
        '컨테이너 환경변수가 모두 이 값을 참조한다.',
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
