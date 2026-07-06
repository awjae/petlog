import { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';

/**
 * "이 SES Identity(이메일 주소/도메인)로 메일을 보낼 수 있다"는 권한 정의 자체를 만든다.
 *
 * s3-access-policy.ts와 동일하게 "누구에게 붙일지"는 모른다 — 호출부에서
 * `IamRolePolicy`/`IamUserPolicy`로 원하는 대상에 붙인다. `identityArn`으로 리소스를
 * 좁혀서, 이 자격증명으로 임의의 발신자 주소를 사칭해 보낼 수 없게 한다(SES는 검증되지
 * 않은 Identity로는 어차피 발송을 거부하지만, IAM 단에서도 최소 권한을 지킨다).
 */
export function buildSesSendPolicyDocument(
  scope: Construct,
  id: string,
  identityArn: string,
): DataAwsIamPolicyDocument {
  return new DataAwsIamPolicyDocument(scope, id, {
    statement: [
      {
        sid: 'AllowSendFromVerifiedIdentity',
        effect: 'Allow',
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [identityArn],
      },
    ],
  });
}
