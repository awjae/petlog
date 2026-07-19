import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { ReportShareSettings } from '../types/report-share.types';

interface ReportShareSettingsQueryData {
  reportShareSettings: ReportShareSettings;
}
interface ReportShareSettingsQueryVariables {
  reportId: string;
}

export const REPORT_SHARE_SETTINGS_QUERY: TypedDocumentNode<
  ReportShareSettingsQueryData,
  ReportShareSettingsQueryVariables
> = gql`
  query ReportShareSettings($reportId: ID!) {
    reportShareSettings(reportId: $reportId) {
      isActive
      includeConcerns
      shareToken
    }
  }
`;

// 공유 페이지 헤더/CTA 개인화를 위한 최소 조회. 비로그인 방문자에게는
// UNAUTHENTICATED 에러가 정상적으로 발생하며, 이는 "회원이 아니다"로 해석된다
// (에러 시 강제 리다이렉트가 일어나지 않도록 이 쿼리를 쏘는 라우트는
// shared/config/publicRoutes.ts의 공개 경로 목록에 포함돼 있어야 한다).
interface ShareViewerQueryData {
  me: { name: string | null } | null;
}

export const SHARE_VIEWER_QUERY: TypedDocumentNode<
  ShareViewerQueryData,
  Record<string, never>
> = gql`
  query ShareViewer {
    me {
      name
    }
  }
`;
