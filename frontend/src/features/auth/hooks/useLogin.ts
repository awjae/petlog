import { useMutation } from '@/shared/hooks/useMutation';
import { loginUser, ApiError } from '../api/auth.api';

function mapLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 401) return '이메일 또는 비밀번호가 올바르지 않아요';
    if (err.statusCode === 404) return '가입되지 않은 이메일이에요';
  }
  return '잠시 후 다시 시도해주세요';
}

export function useLogin() {
  const { loading, error, mutate } = useMutation(
    (email: string, password: string) => loginUser({ email, password }),
    mapLoginError,
  );
  return { loading, error, login: mutate };
}
