// Mock ↔ FCM 전환 시 이 인터페이스만 구현하면 되고, 어떤 구현체를 쓸지는
// 이 패키지의 팩토리(factory.ts)가 결정한다. 호출하는 쪽(NotificationService 등)은
// 구현체를 알 필요 없이 이 인터페이스와 DI 토큰(PUSH_SENDER)만 알면 된다.
export interface PushSender {
  send(token: string, title: string, body: string): Promise<void>;
}

export const PUSH_SENDER = Symbol('PUSH_SENDER');
