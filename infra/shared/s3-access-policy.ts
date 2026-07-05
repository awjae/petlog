import { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';

/**
 * "S3 버킷에 객체 읽기/쓰기가 필요하다"는 권한 정의 자체를 만든다.
 *
 * 이 함수는 의도적으로 "누구에게 붙일지"를 모른다 — IAM User(정적 액세스 키),
 * ECS Task Role 어디에도 동일하게 재사용하기 위해서다. 호출부에서
 * `IamUserPolicy` / `IamRolePolicy` 등으로 원하는 대상에 붙이면 된다 (정의와 부착의 분리).
 */
export function buildS3ReadWritePolicyDocument(
  scope: Construct,
  id: string,
  bucketArn: string,
): DataAwsIamPolicyDocument {
  return new DataAwsIamPolicyDocument(scope, id, {
    statement: [
      {
        sid: 'AllowObjectReadWrite',
        effect: 'Allow',
        actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        resources: [`${bucketArn}/*`],
      },
    ],
  });
}
