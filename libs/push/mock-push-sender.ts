import type { PushSender } from './push-sender.interface';

// 로컬 개발 및 테스트 환경 기본 구현체. 실제로 푸시를 발송하지 않고
// 콘솔에 로그만 남긴다. FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY 중
// 하나라도 비어있으면 factory.ts가 이 구현체를 기본으로 선택한다.
export class MockPushSender implements PushSender {
  async send(token: string, title: string, body: string): Promise<void> {
    console.log(`[MockPushSender] token=${token} title="${title}"`);
    console.log(body);
  }
}
