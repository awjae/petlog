'use client';

import { useState } from 'react';

// REST 도메인(예: auth) 전용 mutation 훅이다. GraphQL 도메인은 Apollo의
// useMutation을 직접 사용한다 (docs/decisions/008-graphql-prisma.md 참고).
export function useMutation<TArgs extends unknown[], TData = void>(
  fn: (...args: TArgs) => Promise<TData>,
  mapError?: (err: unknown) => string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function mutate(...args: TArgs): Promise<TData | null> {
    setLoading(true);
    setError('');
    try {
      return await fn(...args);
    } catch (err) {
      setError(mapError ? mapError(err) : '잠시 후 다시 시도해주세요');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, mutate };
}
