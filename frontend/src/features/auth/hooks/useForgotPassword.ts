import { useMutation } from '@/shared/hooks/useMutation';
import { requestPasswordReset, ApiError } from '../api/auth.api';

function mapForgotPasswordError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 400) return '올바른 이메일 형식을 입력해주세요';
    if (err.statusCode === 429) return '잠시 후 다시 시도해주세요';
  }
  return '잠시 후 다시 시도해주세요';
}

export function useForgotPassword() {
  const { loading, error, mutate } = useMutation(
    (email: string) => requestPasswordReset(email),
    mapForgotPasswordError,
  );

  return { loading, error, requestReset: mutate };
}
