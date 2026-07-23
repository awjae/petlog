import { ConsentType } from '@prisma/client';

// 정책 버전 문자열. termsOfService/privacyPolicy는 실제 배포된 정책 페이지의 시행일(YYYY-MM-DD)과
// 반드시 일치해야 한다 — 프론트엔드 /terms, /privacy 페이지가 같은 값을 표시하는지 별도 확인 필요.
// marketingNotification은 시행일 개념이 없어 단순 버전 문자열(v1)을 사용한다.
export const CONSENT_POLICY_VERSIONS: Record<ConsentType, string> = {
  termsOfService: '2026-07-23',
  privacyPolicy: '2026-07-09',
  marketingNotification: 'v1',
};

// 필수 동의 항목 — agreed=false 행은 DB CHECK 제약(user_consents_required_agreed_check)으로도
// 차단되지만, 회원가입 시점에 명확한 에러 메시지를 주기 위해 서비스 레이어에서도 먼저 검증한다.
export const REQUIRED_CONSENT_TYPES: ConsentType[] = [
  ConsentType.termsOfService,
  ConsentType.privacyPolicy,
];
