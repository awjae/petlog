import { Construct } from 'constructs';

import { DataAwsIamPolicyDocument } from '../.gen/providers/aws/data-aws-iam-policy-document';

/**
 * "이 SES Identity(이메일 주소/도메인)로 메일을 보낼 수 있다"는 권한 정의 자체를 만든다.
 *
 * s3-access-policy.ts와 동일하게 "누구에게 붙일지"는 모른다 — 호출부에서
 * `IamRolePolicy`/`IamUserPolicy`로 원하는 대상에 붙인다. `identityArn`으로 리소스를
 * 좁혀서, 이 자격증명으로 임의의 발신자 주소를 사칭해 보낼 수 없게 한다(SES는 검증되지
 * 않은 Identity로는 어차피 발송을 거부하지만, IAM 단에서도 최소 권한을 지킨다).
 *
 * `configurationSetArn`도 함께 받는 이유: Identity에 기본 설정 세트가 붙어 있으면 SES는
 * `SendEmail` 한 번에 대해 **Identity와 설정 세트 두 리소스 모두**에 대한 권한을 검사한다.
 * Identity ARN만 허용했을 때 실제로 다음 오류로 발송이 전부 실패했다(2026-07-30 확인).
 *
 *   AccessDenied: ... not authorized to perform `ses:SendEmail' on resource
 *   `arn:aws:ses:...:configuration-set/my-first-configuration-set'
 *
 * 게다가 `requestPasswordReset`은 enumeration 방지를 위해 발송 실패를 삼키므로, 이 누락은
 * 배포/응답 어디에서도 드러나지 않고 "메일이 안 온다"로만 나타난다.
 */
export function buildSesSendPolicyDocument(
  scope: Construct,
  id: string,
  identityArn: string,
  configurationSetArn: string,
): DataAwsIamPolicyDocument {
  return new DataAwsIamPolicyDocument(scope, id, {
    statement: [
      {
        sid: 'AllowSendFromVerifiedIdentity',
        effect: 'Allow',
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [identityArn, configurationSetArn],
      },
    ],
  });
}
