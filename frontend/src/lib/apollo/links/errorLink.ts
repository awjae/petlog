import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client';
import { Observable } from 'rxjs';
import { authFetch } from '@/lib/auth/authFetch';

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const resolvePending = () => {
  pendingRequests.forEach((r) => r());
  pendingRequests = [];
};

export const errorLink = new ErrorLink(({ error, operation, forward }) => {
  // NestJS GqlAuthGuard 인증 실패: HTTP 200 + errors[].extensions.code UNAUTHENTICATED
  const isUnauthenticated =
    CombinedGraphQLErrors.is(error) &&
    error.errors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        (err.extensions?.originalError as { statusCode?: number } | undefined)?.statusCode === 401,
    );

  if (!isUnauthenticated) return;

  return new Observable((observer) => {
    if (isRefreshing) {
      pendingRequests.push(() => forward(operation).subscribe(observer));
      return;
    }

    isRefreshing = true;

    authFetch('/auth/refresh', { method: 'POST' })
      .then(() => {
        resolvePending();
        forward(operation).subscribe(observer);
      })
      .catch(() => {
        pendingRequests = [];
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        observer.error(new Error('Session expired'));
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});
