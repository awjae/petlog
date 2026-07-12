import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface RegisterPushTokenData {
  registerPushToken: boolean;
}
interface RegisterPushTokenVariables {
  token: string;
}

export const REGISTER_PUSH_TOKEN_MUTATION: TypedDocumentNode<
  RegisterPushTokenData,
  RegisterPushTokenVariables
> = gql`
  mutation RegisterPushToken($token: String!) {
    registerPushToken(token: $token)
  }
`;

interface SendTestPushNotificationData {
  sendTestPushNotification: boolean;
}

export const SEND_TEST_PUSH_NOTIFICATION_MUTATION: TypedDocumentNode<
  SendTestPushNotificationData,
  Record<string, never>
> = gql`
  mutation SendTestPushNotification {
    sendTestPushNotification
  }
`;

// 로그인 여부만 확인하기 위한 최소 쿼리. settings 기능의 SettingsMe(name, email)와는
// 목적이 다르므로 별도 오퍼레이션으로 분리한다 — 동일 Query.me 루트 필드를 조회하지만
// Apollo 캐시에서 정규화되어 병합되므로 중복 요청 비용은 없다.
interface NotificationAuthCheckData {
  me: { id: string };
}

export const NOTIFICATION_AUTH_CHECK_QUERY: TypedDocumentNode<
  NotificationAuthCheckData,
  Record<string, never>
> = gql`
  query NotificationAuthCheck {
    me {
      id
    }
  }
`;
