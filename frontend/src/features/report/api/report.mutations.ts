import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { ReportType, GenerateReportResult } from '../types/report.types';

interface GenerateReportData {
  generateReport: GenerateReportResult;
}
interface GenerateReportVariables {
  petId: string;
  type: ReportType;
}

export const GENERATE_REPORT_MUTATION: TypedDocumentNode<
  GenerateReportData,
  GenerateReportVariables
> = gql`
  mutation GenerateReport($petId: ID!, $type: ReportType!) {
    generateReport(petId: $petId, type: $type) {
      reportId
      status
    }
  }
`;
