import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { GenerateReportResult } from '../types/report.types';

interface GenerateReportData {
  generateReport: GenerateReportResult;
}
interface GenerateReportVariables {
  petId: string;
  periodStart: string;
  periodEnd: string;
}

export const GENERATE_REPORT_MUTATION: TypedDocumentNode<
  GenerateReportData,
  GenerateReportVariables
> = gql`
  mutation GenerateReport($petId: ID!, $periodStart: DateTime!, $periodEnd: DateTime!) {
    generateReport(petId: $petId, periodStart: $periodStart, periodEnd: $periodEnd) {
      reportId
      status
    }
  }
`;
