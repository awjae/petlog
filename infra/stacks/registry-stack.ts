import { Construct } from 'constructs';
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from 'cdktf';

import { AwsProvider } from '../.gen/providers/aws/provider';
import { EcrRepository } from '../.gen/providers/aws/ecr-repository';
import { EcrLifecyclePolicy } from '../.gen/providers/aws/ecr-lifecycle-policy';

import {
  DEFAULT_AWS_REGION,
  TERRAFORM_LOCK_TABLE,
  TERRAFORM_STATE_BUCKET,
  Environment,
} from '../config';

export interface RegistryStackProps {
  /** 배포 대상 환경. 저장소 네이밍(`petlog-backend-{env}`)에 사용한다. */
  readonly environment: Environment;
}

/**
 * ECR(Elastic Container Registry) 저장소를 관리하는 스택.
 *
 * 컴퓨트 플랫폼(App Runner든 향후 ECS Fargate든)과 완전히 무관하게 독립적으로 존재한다.
 * backend-stack/frontend-stack은 이 스택이 만든 저장소 URL만 참조하고, 컴퓨트를 바꾸더라도
 * 이 스택은 그대로 재사용된다 — "레지스트리 vs 컴퓨트"를 별도 스택으로 분리한 이유다.
 */
export class RegistryStack extends TerraformStack {
  public readonly backendRepository: EcrRepository;
  public readonly frontendRepository: EcrRepository;

  constructor(scope: Construct, id: string, props: RegistryStackProps) {
    super(scope, id);

    const { environment } = props;

    new S3Backend(this, {
      bucket: TERRAFORM_STATE_BUCKET,
      key: `registry-stack/${environment}/terraform.tfstate`,
      region: DEFAULT_AWS_REGION,
      dynamodbTable: TERRAFORM_LOCK_TABLE,
      encrypt: true,
    });

    const awsRegion = new TerraformVariable(this, 'aws_region', {
      type: 'string',
      default: DEFAULT_AWS_REGION,
      description: 'ECR 저장소를 배포할 AWS 리전 (기본값: 서울)',
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

    this.backendRepository = this.createRepository('backend', environment);
    this.frontendRepository = this.createRepository('frontend', environment);

    new TerraformOutput(this, 'backend_repository_url', {
      value: this.backendRepository.repositoryUrl,
      description: '백엔드 ECR 저장소 URL (docker push/pull 대상)',
    });

    new TerraformOutput(this, 'frontend_repository_url', {
      value: this.frontendRepository.repositoryUrl,
      description: '프론트엔드 ECR 저장소 URL (docker push/pull 대상)',
    });
  }

  /**
   * `petlog-{service}-{environment}` 이름의 ECR 저장소를 만들고, 스토리지 비용 관리를 위한
   * lifecycle 정책(태그 없는 이미지 1일 후 만료, 태그된 이미지는 최근 10개만 보관)을 건다.
   */
  private createRepository(
    service: 'backend' | 'frontend',
    environment: Environment,
  ): EcrRepository {
    const repository = new EcrRepository(this, `${service}-repository`, {
      name: `petlog-${service}-${environment}`,
      imageTagMutability: 'MUTABLE', // 지금은 `latest` 태그 하나만 재사용 (CI/CD 자동 태깅은 범위 밖).
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      // 개인 프로젝트 비용/보안 가드레일: 스택이 destroy될 때 이미지가 남아있어도 막히지
      // 않도록 강제 삭제를 허용한다 (dev/스테이징 환경을 쉽게 지울 수 있어야 한다는 원칙).
      forceDelete: true,
    });

    new EcrLifecyclePolicy(this, `${service}-lifecycle-policy`, {
      repository: repository.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: '태그 없는 이미지는 1일 후 만료',
            selection: {
              tagStatus: 'untagged',
              countType: 'sinceImagePushed',
              countUnit: 'days',
              countNumber: 1,
            },
            action: { type: 'expire' },
          },
          {
            rulePriority: 2,
            // 지금은 `latest` 태그만 쓰지만, 향후 CI/CD가 커밋 SHA 등으로 태깅 전략을
            // 바꾸면 tagPrefixList를 그에 맞게 넓혀야 한다.
            description: '태그된 이미지는 최근 10개만 보관',
            selection: {
              tagStatus: 'tagged',
              tagPrefixList: ['latest'],
              countType: 'imageCountMoreThan',
              countNumber: 10,
            },
            action: { type: 'expire' },
          },
        ],
      }),
    });

    return repository;
  }
}
