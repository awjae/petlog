import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export interface ConsentStatus {
  marketingNotificationAgreed: boolean;
}

interface ConsentStatusData {
  consentStatus: ConsentStatus;
}

export const CONSENT_STATUS_QUERY: TypedDocumentNode<
  ConsentStatusData,
  Record<string, never>
> = gql`
  query ConsentStatus {
    consentStatus {
      marketingNotificationAgreed
    }
  }
`;

interface UpdateMarketingConsentData {
  updateMarketingConsent: ConsentStatus;
}

interface UpdateMarketingConsentVariables {
  agreed: boolean;
}

export const UPDATE_MARKETING_CONSENT_MUTATION: TypedDocumentNode<
  UpdateMarketingConsentData,
  UpdateMarketingConsentVariables
> = gql`
  mutation UpdateMarketingConsent($agreed: Boolean!) {
    updateMarketingConsent(agreed: $agreed) {
      marketingNotificationAgreed
    }
  }
`;
