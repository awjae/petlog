import { useMutation } from '@/shared/hooks/useMutation';
import { registerUser, ApiError } from '../api/auth.api';
import type { RegisterConsents } from '../types/auth.types';

function mapRegisterError(err: unknown): string {
  if (err instanceof ApiError && err.statusCode === 409) return '이미 사용 중인 이메일이에요';
  if (err instanceof ApiError && err.statusCode === 400) return '필수 약관에 동의해주세요';
  return '잠시 후 다시 시도해주세요';
}

export function useRegister() {
  const { loading, error, mutate } = useMutation(
    (email: string, password: string, consents: RegisterConsents) =>
      registerUser({ email, password, consents }),
    mapRegisterError,
  );

  return { loading, error, register: mutate };
}
