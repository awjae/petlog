import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { ReportStatusResult, Report, ReportPollStatus, PetBasic } from '../types/report.types';

interface ReportStatusQueryData {
  reportStatus: ReportStatusResult;
}
interface ReportStatusQueryVariables {
  petId: string;
}

export const REPORT_STATUS_QUERY: TypedDocumentNode<
  ReportStatusQueryData,
  ReportStatusQueryVariables
> = gql`
  query ReportStatus($petId: ID!) {
    reportStatus(petId: $petId) {
      canGenerateThisMonth
      hasEnoughRecords
      recordCount
      recordDays
      nextAvailableAt
      processingReport {
        id
        status
      }
    }
  }
`;

interface ReportsQueryData {
  reports: Report[];
}
interface ReportsQueryVariables {
  petId: string;
}

export const REPORTS_QUERY: TypedDocumentNode<ReportsQueryData, ReportsQueryVariables> = gql`
  query Reports($petId: ID!) {
    reports(petId: $petId) {
      id
      type
      status
      overview
      highlights
      concerns
      recommendations
      generatedBy
      periodStart
      periodEnd
      createdAt
    }
  }
`;

interface ReportQueryData {
  report: Report;
}
interface ReportQueryVariables {
  id: string;
}

export const REPORT_QUERY: TypedDocumentNode<ReportQueryData, ReportQueryVariables> = gql`
  query Report($id: ID!) {
    report(id: $id) {
      id
      petId
      type
      status
      overview
      highlights
      concerns
      recommendations
      generatedBy
      periodStart
      periodEnd
      createdAt
    }
  }
`;

interface ReportPollStatusQueryData {
  reportPollStatus: ReportPollStatus;
}
interface ReportPollStatusQueryVariables {
  id: string;
}

export const REPORT_POLL_STATUS_QUERY: TypedDocumentNode<
  ReportPollStatusQueryData,
  ReportPollStatusQueryVariables
> = gql`
  query ReportPollStatus($id: ID!) {
    reportPollStatus(id: $id) {
      id
      status
      failedReason
    }
  }
`;

interface PetsForReportQueryData {
  me: { pets: PetBasic[] } | null;
}

export const PETS_FOR_REPORT_QUERY: TypedDocumentNode<
  PetsForReportQueryData,
  Record<string, never>
> = gql`
  query PetsForReport {
    me {
      pets {
        id
        name
      }
    }
  }
`;
