// 리포트 공유 도메인 타입.
// 소유자용(GraphQL)과 공개 조회용(REST)은 백엔드에서도 별도 계약으로 분리돼 있으므로
// 프론트에서도 타입을 분리해서 관리한다.

/** 소유자 전용 — 공유 설정 조회/변경 결과 (ReportShareResolver). */
export interface ReportShareSettings {
  isActive: boolean;
  includeConcerns: boolean;
  shareToken: string | null;
}

/**
 * 공개(비로그인) 조회 REST 응답 (ReportSharePublicController).
 * concerns는 공유자가 포함하지 않기로 설정했으면 키 자체가 응답에서 빠진다
 * (빈 배열이 아니라 "필드 없음") — 이 페이지 전용 렌더링 분기의 근거가 된다.
 */
export interface PublicSharedReport {
  petName: string;
  overview: string | null;
  highlights: string[];
  concerns?: string[];
  recommendations: string[];
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}
