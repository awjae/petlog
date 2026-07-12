import type { PushSender } from './push-sender.interface';
import { MockPushSender } from './mock-push-sender';
import { FcmPushSender, type FcmPushSenderConfig } from './fcm/client';

export interface CreatePushSenderOptions {
  // projectId/clientEmail/privateKey가 모두 설정되어 있을 때만 FcmPushSender를 생성할 수 있다.
  fcm?: FcmPushSenderConfig;
}

// 어떤 PushSender 구현체를 쓸지 이 팩토리 한 곳에서 결정한다.
// 호출하는 쪽(NestJS NotificationModule 등)은 PushSender 인터페이스만 알면 되고,
// Mock ↔ FCM 전환은 이 팩토리 로직만 바꾸면 된다.
//
// FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY 중 하나라도 비어있으면
// 항상 Mock을 사용한다.
export function createPushSender(options: CreatePushSenderOptions): PushSender {
  if (options.fcm) {
    return new FcmPushSender(options.fcm);
  }
  return new MockPushSender();
}
