import type { MailSender } from './mail-sender.interface';
import { MockMailSender } from './mock-mail-sender';
import { SesMailSender, type SesMailSenderConfig } from './ses/client';

export interface CreateMailSenderOptions {
  // MAIL_PROVIDER 값. 'ses'일 때만 SES 실사용을 고려한다.
  // NODE_ENV/PETLOG_ENV(운영 배포 여부)와는 별개 스위치다 — 로컬 개발 중에도
  // 쿠키 secure 플래그 등 다른 production 전용 동작을 건드리지 않은 채
  // 메일만 실제로 발송해보는 포트폴리오/QA 테스트를 지원하기 위함이다.
  provider: string | undefined;
  // region/fromAddress가 모두 설정되어 있을 때만 SesMailSender를 생성할 수 있다.
  ses?: SesMailSenderConfig;
}

// 어떤 MailSender 구현체를 쓸지 이 팩토리 한 곳에서 결정한다.
// 호출하는 쪽(NestJS AuthModule 등)은 MailSender 인터페이스만 알면 되고,
// Mock ↔ SES 전환은 이 팩토리 로직만 바꾸면 된다.
//
// MAIL_PROVIDER=ses가 아니면 항상 Mock을 사용한다. ses로 지정했더라도 SES 설정이
// 없으면(region/fromAddress 누락) 안전하게 Mock으로 폴백한다.
export function createMailSender(options: CreateMailSenderOptions): MailSender {
  if (options.provider === 'ses' && options.ses) {
    return new SesMailSender(options.ses);
  }
  return new MockMailSender();
}
