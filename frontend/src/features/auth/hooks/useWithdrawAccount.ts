import { useState } from 'react';
import { withdrawAccount, ApiError } from '../api/auth.api';

export type WithdrawResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-password' | 'session-expired' | 'unknown' };

/**
 * 회원 탈퇴 확정 훅.
 *
 * 비밀번호 불일치(401)는 화면에 인라인 에러로 노출해야 하고,
 * 그 외 실패(400/429/네트워크 오류 등)는 토스트로 노출해야 하므로
 * 두 실패를 구분해서 반환한다. 어떤 에러를 인라인/토스트 중 무엇으로
 * 보여줄지는 컴포넌트가 정하되, statusCode를 직접 들여다보는 로직은
 * 여기(hook)에만 둔다.
 *
 * 401은 "비밀번호 불일치"와 "세션 만료(JwtAuthGuard 자체 거부)" 두 경우 모두
 * 같은 상태 코드로 내려오지만 메시지가 다르다 — 세션 만료를 비밀번호 오류로
 * 오인시키지 않도록 메시지 내용으로 구분한다.
 */
export function useWithdrawAccount() {
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function withdraw(password: string): Promise<WithdrawResult> {
    setLoading(true);
    setPasswordError('');
    try {
      await withdrawAccount(password);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        if (err.message.includes('비밀번호')) {
          setPasswordError('비밀번호가 일치하지 않아요');
          return { ok: false, reason: 'invalid-password' };
        }
        return { ok: false, reason: 'session-expired' };
      }
      return { ok: false, reason: 'unknown' };
    } finally {
      setLoading(false);
    }
  }

  return { withdraw, loading, passwordError };
}
