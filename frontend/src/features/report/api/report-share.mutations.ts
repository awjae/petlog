import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { ReportShareSettings } from '../types/report-share.types';

interface StartReportShareData {
  startReportShare: ReportShareSettings;
}
interface ReportShareMutationVariables {
  reportId: string;
}

export const START_REPORT_SHARE_MUTATION: TypedDocumentNode<
  StartReportShareData,
  ReportShareMutationVariables
> = gql`
  mutation StartReportShare($reportId: ID!) {
    startReportShare(reportId: $reportId) {
      isActive
      includeConcerns
      shareToken
    }
  }
`;

interface StopReportShareData {
  stopReportShare: ReportShareSettings;
}

export const STOP_REPORT_SHARE_MUTATION: TypedDocumentNode<
  StopReportShareData,
  ReportShareMutationVariables
> = gql`
  mutation StopReportShare($reportId: ID!) {
    stopReportShare(reportId: $reportId) {
      isActive
      includeConcerns
      shareToken
    }
  }
`;

interface SetReportShareIncludeConcernsData {
  setReportShareIncludeConcerns: ReportShareSettings;
}
interface SetReportShareIncludeConcernsVariables {
  reportId: string;
  includeConcerns: boolean;
}

export const SET_REPORT_SHARE_INCLUDE_CONCERNS_MUTATION: TypedDocumentNode<
  SetReportShareIncludeConcernsData,
  SetReportShareIncludeConcernsVariables
> = gql`
  mutation SetReportShareIncludeConcerns($reportId: ID!, $includeConcerns: Boolean!) {
    setReportShareIncludeConcerns(reportId: $reportId, includeConcerns: $includeConcerns) {
      isActive
      includeConcerns
      shareToken
    }
  }
`;
