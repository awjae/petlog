import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { ApprunnerService } from '../.gen/providers/aws/apprunner-service';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';
import { createEcrAccessRole } from '../shared/apprunner-iam';
import { RegistryStack } from './registry-stack';
import { BackendStack } from './backend-stack';

export interface FrontendStackProps {
  /** 배포 대상 환경. 서비스/역할 네이밍에 사용한다. */
  readonly environment: Environment;
  /** ECR 이미지 URL cross-stack reference를 위해 registry-stack 인스턴스를 그대로 받는다. */
  readonly registryStack: RegistryStack;
  /**
   * backend-stack의 App Runner 서비스 URL을 cross-stack reference로 읽어 NEXT_PUBLIC_API_URL을
   * 구성한다. 이 때문에 main.ts에서 frontend-stack은 반드시 backend-stack보다 나중에 생성한다.
   */
  readonly backendStack: BackendStack;
}

/**
 * Next.js 프론트엔드를 App Runner로 배포하는 스택 (Vercel 완전 대체).
 *
 * 프론트엔드는 AWS SDK로 직접 AWS 리소스를 호출하지 않으므로(모든 데이터는 백엔드 API를
 * 통해서만 접근한다), Instance Role을 별도로 부여하지 않는다. 필요해지면(예: 서버 컴포넌트에서
 * S3 presigned URL을 직접 발급하는 등) 그때 instanceConfiguration.instanceRoleArn을 추가한다.
 *
 * ECS Fargate로 전환할 때 바뀌는 것/그대로인 것은 backend-stack.ts 상단 주석 및
 * infra/README.md의 "ECS Fargate로 전환 시" 절과 동일한 원칙을 따른다.
 */
export class FrontendStack extends TerraformStack {
  public readonly service: ApprunnerService;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id);

    const { environment, registryStack, backendStack } = props;

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
      description: '프론트엔드 App Runner 서비스를 배포할 AWS 리전 (기본값: 서울)',
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

    // Access Role은 backend-stack과 동일한 패턴(shared/apprunner-iam.ts)으로 별도 생성한다.
    // backend-stack의 Role을 그대로 재사용하지 않는 이유: 두 스택이 서로 다른 서비스/저장소를
    // 관리하므로, 한쪽 스택만 배포/삭제해도 다른 쪽 IAM 리소스에 영향이 없도록 독립시킨다.
    const accessRole = createEcrAccessRole(
      this,
      'frontend-access-role',
      `petlog-frontend-access-role-${environment}`,
    );

    this.service = new ApprunnerService(this, 'frontend-service', {
      serviceName: `petlog-frontend-${environment}`,
      instanceConfiguration: {
        // 개인 프로젝트 비용 최소화: App Runner 최소 사양 (0.25 vCPU / 0.5 GB).
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/api/health',
      },
      sourceConfiguration: {
        // ECR에 새 `latest` 이미지가 push되면 App Runner가 자동으로 재배포한다.
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          accessRoleArn: accessRole.arn,
        },
        imageRepository: {
          imageIdentifier: `${registryStack.frontendRepository.repositoryUrl}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: {
              // 주의: NEXT_PUBLIC_API_URL은 여기(런타임 환경변수)에 넣지 않는다.
              // Next.js는 next.config.ts의 rewrites() 목적지를 `next build` 시점에
              // 고정시키므로, App Runner 런타임 환경변수로 나중에 값을 바꿔도 반영되지
              // 않는다 (frontend-architect가 실제 빌드 산출물로 검증함). 그래서
              // NEXT_PUBLIC_API_URL은 Docker 이미지 빌드 시 --build-arg로 주입해야 하고,
              // 그 값의 출처가 이 backendStack.service.serviceUrl이라는 사실만 여기
              // 남겨둔다 — 실제 주입 절차는 infra/README.md "최초 배포 전 수동 절차" 참고.
              NODE_ENV: 'production',
            },
          },
        },
      },
    });

    new TerraformOutput(this, 'frontend_service_url', {
      value: this.service.serviceUrl,
      description: '프론트엔드 App Runner 기본 도메인 (최종 사용자 접속 URL).',
    });

    new TerraformOutput(this, 'frontend_access_role_arn', {
      value: accessRole.arn,
      description: 'ECR pull용 Access Role ARN',
    });

    // NEXT_PUBLIC_API_URL은 런타임 환경변수가 아니라 Docker 빌드 시 --build-arg로
    // 주입해야 한다 (Next.js가 next.config.ts의 rewrites 목적지를 빌드 시점에 고정시키기
    // 때문). 그 값을 매번 수동으로 재구성하지 않도록 여기서 출력해둔다.
    new TerraformOutput(this, 'expected_next_public_api_url', {
      value: `https://${backendStack.service.serviceUrl}`,
      description:
        '프론트엔드 이미지를 빌드할 때 --build-arg NEXT_PUBLIC_API_URL로 넘겨야 하는 값 ' +
        '(런타임 환경변수로는 반영되지 않음 — infra/README.md "최초 배포 전 수동 절차" 참고).',
    });
  }
}
