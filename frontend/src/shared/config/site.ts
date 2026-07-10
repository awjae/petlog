// filepath: src/shared/config/site.ts
//
// 서비스 전역에서 사용하는 사이트 상수.
// Petlog는 프로덕션 도메인이 https://petlog.quest 하나뿐이고 로컬 개발에서는
// 이 값이 의미를 갖지 않으므로(SEO 메타데이터 생성 전용) 환경변수로 분리하지 않고
// 하드코딩된 상수로 관리한다.
export const SITE_URL = 'https://petlog.quest';
export const SITE_NAME = 'Petlog';
export const SITE_DESCRIPTION =
  '체중, 식사, 활동량을 기록하고 AI 리포트로 반려동물 건강 변화를 파악하는 건강 기록 서비스';
