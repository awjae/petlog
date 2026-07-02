// 페이지 이동(router.push) 직후 새 페이지 진입 시 보여줄 토스트 메시지를
// sessionStorage에 잠시 보관하기 위한 유틸. 예: 반려동물 삭제 후 홈 이동 시
// 성공 토스트를 홈 화면에서 표시.
const STORAGE_KEY = 'petlog:pendingToast';

export function setPendingToast(message: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, message);
  } catch {
    // sessionStorage 접근 불가 시 무시
  }
}

export function consumePendingToast(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const message = window.sessionStorage.getItem(STORAGE_KEY);
    if (message) window.sessionStorage.removeItem(STORAGE_KEY);
    return message;
  } catch {
    return null;
  }
}
