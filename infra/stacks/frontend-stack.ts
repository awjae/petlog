import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { EcsTaskDefinition } from '../.gen/providers/aws/ecs-task-definition';
import { EcsService } from '../.gen/providers/aws/ecs-service';
import { CloudwatchLogGroup } from '../.gen/providers/aws/cloudwatch-log-group';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { createEcsTaskExecutionRole } from '../shared/ecs-iam';
import { RegistryStack } from './registry-stack';
import { NetworkStack } from './network-stack';
import { BackendStack } from './backend-stack';

export interface FrontendStackProps {
  /** 배포 대상 환경. 서비스/역할/로그 그룹 네이밍에 사용한다. */
  readonly environment: Environment;
  /** ECR 이미지 URL cross-stack reference를 위해 registry-stack 인스턴스를 그대로 받는다. */
  readonly registryStack: RegistryStack;
  /** ECS 태스크가 배치될 public 서브넷/보안그룹 cross-stack reference를 위해 그대로 받는다. */
  readonly networkStack: NetworkStack;
  /**
   * backend-stack이 만든 ECS 클러스터, 공유 ALB의 frontend 타겟 그룹, 리스너를
   * cross-stack reference로 읽는다. 이 때문에 main.ts에서 frontend-stack은 반드시
   * backend-stack보다 나중에 생성한다.
   */
  readonly backendStack: BackendStack;
}

/**
 * Next.js 프론트엔드를 ECS Fargate로 배포하는 스택 (Vercel 완전 대체, App Runner에서 재전환).
 *
 * ALB, ECS 클러스터, frontend용 타겟 그룹은 모두 `backend-stack`이 만든다(ALB 리스너의
 * 기본 액션과 경로 기반 라우팅 규칙을 한 곳에서 일관되게 관리하기 위함, `backend-stack.ts`
 * 클래스 주석 참고). 이 스택은 ECS 태스크 정의 + 서비스만 만들고, backend-stack이 만든
 * 타겟 그룹 ARN으로 자신을 등록한다.
 *
 * 프론트엔드는 AWS SDK로 직접 AWS 리소스를 호출하지 않으므로(모든 데이터는 백엔드 API를
 * 통해서만 접근한다), Task Role을 별도로 부여하지 않는다 — Task Execution Role(ECR pull +
 * CloudWatch Logs)만 있으면 충분하다. 필요해지면(예: 서버 컴포넌트에서 S3 presigned URL을
 * 직접 발급하는 등) 그때 Task Role을 추가한다.
 */
export class FrontendStack extends TerraformStack {
  public readonly service: EcsService;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id);

    const { environment, registryStack, networkStack, backendStack } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `frontend-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: '프론트엔드 ECS Fargate 서비스를 배포할 AWS 리전 (기본값: 서울)',
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

    // --- CloudWatch Logs ---
    const frontendLogGroup = new CloudwatchLogGroup(this, 'frontend-log-group', {
      name: `/ecs/petlog-frontend-${environment}`,
      retentionInDays: 7,
    });

    // --- IAM: Task Execution Role ---
    // backend-stack과 동일한 패턴(shared/ecs-iam.ts)으로 별도 생성한다. backend-stack의
    // Role을 그대로 재사용하지 않는 이유: 두 스택이 서로 다른 서비스/저장소를 관리하므로,
    // 한쪽 스택만 배포/삭제해도 다른 쪽 IAM 리소스에 영향이 없도록 독립시킨다.
    const executionRole = createEcsTaskExecutionRole(
      this,
      'frontend-execution-role',
      `petlog-frontend-execution-role-${environment}`,
    );

    // --- ECS Task Definition ---
    // 개인 프로젝트 비용 최소화: Fargate 최소 사양 (256 CPU units / 512 MiB).
    //
    // 주의: NEXT_PUBLIC_API_URL은 여기(런타임 환경변수)에 넣지 않는다. Next.js는
    // next.config.ts의 rewrites() 목적지를 `next build` 시점에 고정시키므로, 런타임
    // 환경변수로 나중에 값을 바꿔도 반영되지 않는다(frontend-architect가 실제 빌드
    // 산출물로 검증함). 그래서 NEXT_PUBLIC_API_URL은 Docker 이미지 빌드 시 --build-arg로
    // 주입해야 하고, 그 값은 backendStack.albUrl(공유 ALB URL)을 그대로 쓴다 — backend와
    // frontend가 이제 같은 도메인을 쓰므로 더 이상 별도 배포 단계를 기다릴 필요가 없다
    // (infra/README.md 참고).
    const frontendTaskDefinition = new EcsTaskDefinition(this, 'frontend-task-definition', {
      family: `petlog-frontend-${environment}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      // backend-stack.ts와 동일한 이유: 이미지가 ARM64(Apple Silicon)로 빌드되므로 Fargate
      // 런타임도 ARM64로 맞춘다 ("exec format error" 방지, Graviton이라 비용도 더 저렴).
      runtimePlatform: {
        cpuArchitecture: 'ARM64',
        operatingSystemFamily: 'LINUX',
      },
      containerDefinitions: JSON.stringify([
        {
          name: 'frontend',
          image: `${registryStack.frontendRepository.repositoryUrl}:latest`,
          essential: true,
          portMappings: [{ containerPort: 3000, protocol: 'tcp' }],
          environment: [{ name: 'NODE_ENV', value: 'production' }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': frontendLogGroup.name,
              'awslogs-region': awsRegion.stringValue,
              'awslogs-stream-prefix': 'frontend',
            },
          },
        },
      ]),
    });

    // --- ECS Service ---
    // backend-stack이 만든 ECS 클러스터, ALB의 frontend 타겟 그룹을 그대로 재사용한다.
    // public 서브넷 + assignPublicIp: true 원칙은 backend-stack과 동일하다(network-stack.ts
    // 클래스 주석 참고).
    this.service = new EcsService(this, 'frontend-service', {
      name: `petlog-frontend-${environment}`,
      cluster: backendStack.cluster.id,
      taskDefinition: frontendTaskDefinition.arn,
      desiredCount: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [networkStack.publicSubnets[0].id, networkStack.publicSubnets[1].id],
        securityGroups: [networkStack.ecsTaskSecurityGroup.id],
        assignPublicIp: true,
      },
      loadBalancer: [
        {
          targetGroupArn: backendStack.frontendTargetGroup.arn,
          containerName: 'frontend',
          containerPort: 3000,
        },
      ],
      healthCheckGracePeriodSeconds: 30,
      // backend-stack의 ALB 리스너가 이미 존재해야 타겟 등록이 안전하다(backend-stack.ts와
      // 동일한 이유). 다만 CDKTF는 cross-stack `dependsOn`에 다른 스택의 리소스 전체를
      // 참조하는 것을 지원하지 않는다("Invalid depends_on reference" 에러 — cross-stack
      // 참조는 속성(attribute) 단위로만 가능하다). 대신 배포 순서 자체로 이를 보장한다:
      // main.ts가 frontend-stack을 backend-stack 다음에 생성하고, `scripts/deploy.sh`도
      // backend-stack을 완전히 배포한 뒤에만 frontend-stack을 배포하므로, frontend-stack이
      // 실행되는 시점엔 ALB 리스너가 이미 존재한다.
    });

    new TerraformOutput(this, 'frontend_execution_role_arn', {
      value: executionRole.arn,
      description: 'ECR pull + CloudWatch Logs용 Task Execution Role ARN',
    });

    new TerraformOutput(this, 'expected_next_public_api_url', {
      value: backendStack.albUrl,
      description:
        '프론트엔드 이미지를 빌드할 때 --build-arg NEXT_PUBLIC_API_URL로 넘겨야 하는 값 ' +
        '(런타임 환경변수로는 반영되지 않음 — infra/README.md 참고). backend-stack의 ' +
        'FRONTEND_URL과 동일한 값(공유 ALB URL)이다.',
    });
  }
}
