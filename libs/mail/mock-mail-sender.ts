import type { MailSender } from './mail-sender.interface';

// 로컬 개발 및 테스트 환경 기본 구현체. 실제로 메일을 발송하지 않고
// 콘솔에 로그만 남긴다. MAIL_PROVIDER=ses가 아니면 factory.ts가
// 이 구현체를 기본으로 선택한다.
export class MockMailSender implements MailSender {
  async send(to: string, subject: string, html: string): Promise<void> {
    console.log(`[MockMailSender] to=${to} subject="${subject}"`);
    console.log(html);
  }
}
