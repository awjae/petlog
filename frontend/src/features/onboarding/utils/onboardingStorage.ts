// 온보딩 완료 여부를 localStorage로 관리한다 (서버 저장/DB 마이그레이션은 이번 범위 제외).
//
// 기기 변경/시크릿 모드 등으로 localStorage 접근이 안 되거나 값이 없으면
// "아직 안 봤음"으로 취급해 온보딩을 다시 노출한다 — 감수한 트레이드오프다.
const ONBOARDING_STORAGE_KEY = 'petlog:onboarding-completed';

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// 저장 실패(예: 시크릿 모드에서 쿼터 초과) 시에도 화면 전환을 막지 않도록
// 호출부는 이 함수의 성공 여부와 무관하게 다음 라우팅을 계속 진행해야 한다.
export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // 저장 실패는 무시한다 — 화면 전환은 호출부에서 계속 진행된다.
  }
}
