import { useMutation } from '@/shared/hooks/useMutation';
import { restoreAccount, ApiError } from '../api/auth.api';

function mapRestoreError(err: unknown): string {
  if (err instanceof ApiError && err.statusCode === 409) {
    return '복구 가능 기간이 지났어요. 새로 가입해주세요.';
  }
  return '잠시 후 다시 시도해주세요';
}

export function useRestoreAccount() {
  const { loading, error, mutate } = useMutation(() => restoreAccount(), mapRestoreError);
  return { loading, error, restore: mutate };
}
