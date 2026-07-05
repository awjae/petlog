import { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { IamRole } from '../.gen/providers/aws/iam-role';
import { IamRolePolicyAttachment } from '../.gen/providers/aws/iam-role-policy-attachment';

/**
 * ECS Fargate의 Task Execution Role/Task Role이 공통으로 쓰는 신뢰 정책(trust policy) 문서를
 * 만든다. App Runner와 달리 ECS는 두 Role 모두 동일한 서비스 주체(`ecs-tasks.amazonaws.com`)를
 * 신뢰 주체로 사용한다(App Runner는 Access Role에 `build.apprunner.amazonaws.com`, Instance
 * Role에 `tasks.apprunner.amazonaws.com`으로 서로 다른 Principal을 썼다 — 이 파일이 대체하는
 * `apprunner-iam.ts`의 `buildApprunnerAssumeRolePolicyDocument` 참고).
 */
export function buildEcsTasksAssumeRolePolicyDocument(
  scope: Construct,
  id: string,
): DataAwsIamPolicyDocument {
  return new DataAwsIamPolicyDocument(scope, id, {
    statement: [
      {
        effect: 'Allow',
        actions: ['sts:AssumeRole'],
        principals: [
          {
            type: 'Service',
            identifiers: ['ecs-tasks.amazonaws.com'],
          },
        ],
      },
    ],
  });
}

/**
 * AWS가 ECS Fargate의 ECR pull + CloudWatch Logs 전송 용도로 제공하는 관리형 정책
 * (모든 계정/리전 공통 고정 ARN). App Runner의 `AWSAppRunnerServicePolicyForECRAccess`에
 * 대응하지만, 이 정책은 SSM/Secrets Manager 읽기 권한을 포함하지 않는다 — 컨테이너 정의의
 * `secrets` 필드가 SSM SecureString을 참조하는 서비스(backend)는 별도 인라인 정책을
 * 추가로 붙여야 한다.
 */
const ECS_TASK_EXECUTION_MANAGED_POLICY_ARN =
  'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy';

/**
 * ECS Fargate 태스크가 ECR 이미지를 pull하고 CloudWatch Logs로 로그를 보낼 때 assume하는
 * Task Execution Role을 만든다. (App Runner의 Access Role을 대체)
 */
export function createEcsTaskExecutionRole(
  scope: Construct,
  id: string,
  roleName: string,
): IamRole {
  const assumeRolePolicy = buildEcsTasksAssumeRolePolicyDocument(scope, `${id}-assume-role-policy`);

  const role = new IamRole(scope, id, {
    name: roleName,
    assumeRolePolicy: assumeRolePolicy.json,
  });

  new IamRolePolicyAttachment(scope, `${id}-execution-policy-attachment`, {
    role: role.name,
    policyArn: ECS_TASK_EXECUTION_MANAGED_POLICY_ARN,
  });

  return role;
}

/**
 * ECS Fargate 컨테이너가 런타임에 실제로 assume하는 Task Role을 만든다.
 * (App Runner의 Instance Role을 대체)
 *
 * 이 함수는 신뢰 정책만 붙인 빈 Role만 반환한다 — 실제 권한(S3 접근 등)은 호출부에서
 * `IamRolePolicy`로 별도로 붙인다("어떤 권한이 필요한지"와 "누구에게 붙일지"를 분리하는
 * 원칙, `shared/s3-access-policy.ts`와 동일한 사상).
 */
export function createEcsTaskRole(scope: Construct, id: string, roleName: string): IamRole {
  const assumeRolePolicy = buildEcsTasksAssumeRolePolicyDocument(scope, `${id}-assume-role-policy`);

  return new IamRole(scope, id, {
    name: roleName,
    assumeRolePolicy: assumeRolePolicy.json,
  });
}
