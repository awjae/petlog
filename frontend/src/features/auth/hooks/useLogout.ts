import { logoutUser } from '../api/auth.api';

/**
 * 로그아웃 API 호출만 담당하는 훅.
 * 실패해도 클라이언트 쪽에서 세션 정리를 계속 진행할 수 있도록 에러를 삼킨다.
 * (기존 settings/page.tsx의 로그아웃 fire-and-forget 패턴과 동일)
 */
export function useLogout() {
  async function logout(): Promise<void> {
    try {
      await logoutUser();
    } catch {
      // 로그아웃 실패는 무시하고 클라이언트 상태만 정리한다
    }
  }

  return { logout };
}
