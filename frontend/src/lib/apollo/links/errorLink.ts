import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client';
import { Observable } from 'rxjs';
import { authFetch } from '@/lib/auth/authFetch';
import { SessionExpiredError } from '@/lib/auth/sessionExpiredError';
import { isPublicRoute } from '@/shared/config/publicRoutes';

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
      .catch((refreshError: unknown) => {
        pendingRequests = [];

        // 리프레시가 네트워크 때문에 실패한 경우까지 로그아웃시키면, 산책 중 잠깐
        // 끊긴 사용자가 세션을 잃는다. fetch는 네트워크 단계 실패에서 TypeError를
        // 던지므로(authFetch는 HTTP 거절일 때만 일반 Error를 던진다) 이때는 원래
        // 에러를 그대로 흘려보내 호출부가 네트워크 실패로 다루게 한다.
        if (refreshError instanceof TypeError) {
          observer.error(refreshError);
          return;
        }

        if (typeof window !== 'undefined' && !isPublicRoute(window.location.pathname)) {
          window.location.href = '/login';
        }
        observer.error(new SessionExpiredError());
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});
