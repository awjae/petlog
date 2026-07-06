import { useCallback, useState } from 'react';
import { useMutation } from '@/shared/hooks/useMutation';
import { verifyResetToken, resetPassword, ApiError } from '../api/auth.api';

function mapResetPasswordError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 400) return err.message;
    if (err.statusCode === 429) return '잠시 후 다시 시도해주세요';
  }
  return '잠시 후 다시 시도해주세요';
}

/**
 * 재설정 토큰(?token=xxx)의 유효성을 검증한다.
 * GET /auth/reset-password/verify → { valid: boolean }
 */
export function useVerifyResetToken() {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const verify = useCallback(async (token: string): Promise<boolean> => {
    setVerifying(true);
    try {
      const res = await verifyResetToken(token);
      setTokenValid(res.valid);
      return res.valid;
    } catch {
      // 검증 요청 자체가 실패해도(네트워크 오류 등) 무효 링크로 취급한다.
      setTokenValid(false);
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  return { verifying, tokenValid, verify };
}

/**
 * 새 비밀번호 제출.
 * 410(토큰 무효 — 만료/이미사용/존재안함)은 별도 상태(tokenInvalid)로 구분해
 * 호출부가 즉시 InvalidTokenState로 전환할 수 있게 한다.
 */
export function useResetPassword() {
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const { loading, error, mutate } = useMutation(async (token: string, newPassword: string) => {
    try {
      return await resetPassword(token, newPassword);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 410) {
        setTokenInvalid(true);
      }
      throw err;
    }
  }, mapResetPasswordError);

  return { loading, error, tokenInvalid, resetPassword: mutate };
}
