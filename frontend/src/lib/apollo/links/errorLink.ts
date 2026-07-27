import { ErrorLink } from '@apollo/client/link/error';
import { Observable } from 'rxjs';
import { isUnauthenticatedError } from '@/lib/apollo/graphqlError';
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
  if (!isUnauthenticatedError(error)) return;

  return new Observable((observer) => {
    if (isRefreshing) {
      const pending: PendingRequest = {
        retry: () => forward(operation).subscribe(observer),
        fail: (refreshError) => observer.error(refreshError),
      };
      pendingRequests.push(pending);

      // 구독이 해제되면(화면 이탈 등) 대기 목록에서도 빼야 한다. 남겨두면 리프레시
      // 성공 후 버려진 오퍼레이션이 실제로 재발송되고 그 결과가 캐시에 쓰인다.
      return () => {
        pendingRequests = pendingRequests.filter((request) => request !== pending);
      };
    }

    isRefreshing = true;

    authFetch('/auth/refresh', { method: 'POST' })
      .then(() => {
        // 대기 목록을 비우기 전에 플래그를 내린다. finally에 두면 드레인보다 늦게
        // 실행돼, 그 사이 들어온 요청이 이미 비워진 목록에 쌓여 방치될 수 있다.
        isRefreshing = false;
        retryPending();
        forward(operation).subscribe(observer);
      })
      .catch((refreshError: unknown) => {
        isRefreshing = false;

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
      });
  });
});
