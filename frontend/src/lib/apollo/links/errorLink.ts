import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client';
import { Observable } from 'rxjs';
import { authFetch } from '@/lib/auth/authFetch';
import { AuthRequestError } from '@/lib/auth/authRequestError';
import { SessionExpiredError } from '@/lib/auth/sessionExpiredError';
import { isPublicRoute } from '@/shared/config/publicRoutes';

/**
 * 리프레시가 끝나기를 기다리는 요청. 성공하면 재시도하고, 실패하면 실패를 알려야 한다.
 * 실패 경로 없이 콜백만 버리면 그 요청의 구독자는 아무 신호도 받지 못해 영원히 로딩에
 * 머문다 — 예전엔 곧바로 /login으로 페이지가 날아가 드러나지 않던 결함이다.
 */
interface PendingRequest {
  retry: () => void;
  fail: (error: unknown) => void;
}

let isRefreshing = false;
let pendingRequests: PendingRequest[] = [];

const takePending = (): PendingRequest[] => {
  const taken = pendingRequests;
  pendingRequests = [];
  return taken;
};

const retryPending = () => takePending().forEach((request) => request.retry());
const failPending = (error: unknown) => takePending().forEach((request) => request.fail(error));

/** 서버가 세션을 명시적으로 거절한 경우에만 로그아웃 사유다. */
const isSessionRejected = (error: unknown): boolean =>
  AuthRequestError.is(error) && (error.status === 401 || error.status === 403);

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
      pendingRequests.push({
        retry: () => forward(operation).subscribe(observer),
        fail: (refreshError) => observer.error(refreshError),
      });
      return;
    }

    isRefreshing = true;

    authFetch('/auth/refresh', { method: 'POST' })
      .then(() => {
        retryPending();
        forward(operation).subscribe(observer);
      })
      .catch((refreshError: unknown) => {
        // 연결 실패나 서버 장애는 "세션이 죽었다"가 아니라 "알 수 없다"이다. 여기까지
        // 로그아웃시키면 잠깐 끊긴 사용자가 세션을 잃는다. 원래 에러를 그대로 흘려보내
        // 호출부가 네트워크/서버 오류로 안내하게 둔다.
        if (!isSessionRejected(refreshError)) {
          failPending(refreshError);
          observer.error(refreshError);
          return;
        }

        const expired = new SessionExpiredError();
        failPending(expired);
        if (typeof window !== 'undefined' && !isPublicRoute(window.location.pathname)) {
          window.location.href = '/login';
        }
        observer.error(expired);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});
