import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

interface SettingsMeData {
  me: { id: string; name: string | null; email: string };
}

// id를 반드시 함께 조회한다. InMemoryCache는 User에 별도 typePolicy가 없어 기본 규칙
// (id)로 정규화하는데, id가 없는 me 응답은 User:<id>로 정규화되지 못하고
// ROOT_QUERY.me에 통째로 인라인된다. 그러면 id를 조회하는 다른 me 쿼리(예:
// NotificationAuthCheck)가 쓴 Reference와 같은 자리를 두고 서로 덮어써서, 캐시에서
// 필드가 사라지고 불필요한 재조회가 일어난다. 새 me 쿼리를 추가할 때도 id를 넣는다.
export const SETTINGS_ME_QUERY: TypedDocumentNode<SettingsMeData, Record<string, never>> = gql`
  query SettingsMe {
    me {
      id
      name
      email
    }
  }
`;
