import type { PublicSharedReport } from '../types/report-share.types';

export type PublicReportShareErrorKind = 'not-found' | 'network';

/**
 * 공개 공유 리포트 조회 실패.
 * kind='not-found'는 백엔드가 "토큰 미존재"와 "공유 비활성화"를 의도적으로 구분하지 않고
 * 동일한 404로 응답하는 경우다(enumeration 방지, report-share.service.ts 참고).
 * kind='network'는 그 외 모든 실패(연결 실패, 5xx, 요청 제한 등)를 뭉뚱그린 것으로,
 * "다시 시도"가 의미 있는 케이스로 취급한다.
 */
export class PublicReportShareError extends Error {
  constructor(
    message: string,
    public readonly kind: PublicReportShareErrorKind,
  ) {
    super(message);
    this.name = 'PublicReportShareError';
  }
}

export async function fetchPublicSharedReport(token: string): Promise<PublicSharedReport> {
  let res: Response;
  try {
    res = await fetch(`/api/report-shares/${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  } catch {
    throw new PublicReportShareError('네트워크 연결을 확인해주세요.', 'network');
  }

  if (res.status === 404) {
    throw new PublicReportShareError('공유된 리포트를 찾을 수 없습니다.', 'not-found');
  }

  if (!res.ok) {
    throw new PublicReportShareError('리포트를 불러오지 못했습니다.', 'network');
  }

  return (await res.json()) as PublicSharedReport;
}
