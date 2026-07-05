import { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';
import { IamRole } from '../.gen/providers/aws/iam-role';
import { IamRolePolicyAttachment } from '../.gen/providers/aws/iam-role-policy-attachment';

/**
 * App Runner가 특정 서비스 주체(Principal)로 역할을 assume할 수 있게 하는
 * 신뢰 정책(trust policy) 문서를 만든다.
 *
 * - Access Role: `build.apprunner.amazonaws.com` — 빌드/배포 시 ECR 이미지를 pull한다.
 * - Instance Role: `tasks.apprunner.amazonaws.com` — 컨테이너 런타임이 실제로 assume한다.
 *
 * 이 두 Role은 신뢰 주체와 권한 범위가 완전히 다르므로 절대 하나로 합치지 않는다.
 */
export function buildApprunnerAssumeRolePolicyDocument(
  scope: Construct,
  id: string,
  servicePrincipal: 'build.apprunner.amazonaws.com' | 'tasks.apprunner.amazonaws.com',
): DataAwsIamPolicyDocument {
  return new DataAwsIamPolicyDocument(scope, id, {
    statement: [
      {
        effect: 'Allow',
        actions: ['sts:AssumeRole'],
        principals: [
          {
            type: 'Service',
            identifiers: [servicePrincipal],
          },
        ],
      },
    ],
  });
}

/** AWS가 App Runner의 ECR pull 용도로 제공하는 관리형 정책 (모든 계정/리전 공통 고정 ARN). */
const ECR_ACCESS_MANAGED_POLICY_ARN =
  'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess';

/**
 * App Runner 서비스가 ECR에서 이미지를 pull할 때 사용하는 Access Role을 만든다.
 * ECS Fargate로 전환할 때는 이 Role 자체를 지우고 태스크 실행 역할(task execution role)로
 * 대체하면 된다 — image pull 권한이 필요하다는 요구사항은 동일하게 유지된다.
 */
export function createEcrAccessRole(scope: Construct, id: string, roleName: string): IamRole {
  const assumeRolePolicy = buildApprunnerAssumeRolePolicyDocument(
    scope,
    `${id}-assume-role-policy`,
    'build.apprunner.amazonaws.com',
  );

  const role = new IamRole(scope, id, {
    name: roleName,
    assumeRolePolicy: assumeRolePolicy.json,
  });

  new IamRolePolicyAttachment(scope, `${id}-ecr-access-attachment`, {
    role: role.name,
    policyArn: ECR_ACCESS_MANAGED_POLICY_ARN,
  });

  return role;
}
