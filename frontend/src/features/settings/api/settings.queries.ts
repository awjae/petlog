import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface SettingsMeData {
  me: { name: string | null; email: string };
}

export const SETTINGS_ME_QUERY: TypedDocumentNode<SettingsMeData, Record<string, never>> = gql`
  query SettingsMe {
    me {
      name
      email
    }
  }
`;
