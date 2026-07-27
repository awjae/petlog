import { AuthRequestError } from './authRequestError';

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 호출부가 "세션이 죽었다"와 "서버가 잠깐 이상하다"를 구분할 수 있게 상태 코드를
  // 에러에 싣는다. 메시지 문자열에만 있으면 파싱해야 한다.
  if (!response.ok) {
    throw new AuthRequestError(response.status);
  }

  return response;
}
