import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { HomeQueryQuery, HomeQueryQueryVariables } from '@/generated/graphql';

export const HOME_QUERY: TypedDocumentNode<HomeQueryQuery, HomeQueryQueryVariables> = gql`
  query HomeQuery {
    me {
      # id 없이 조회하면 캐시에서 ROOT_QUERY.me 자리를 두고 다른 me 쿼리와 충돌한다
      # (settings.queries.ts의 주석 참고).
      id
      recordDates(limit: 90)
      pets {
        id
        name
        species
        breed
        birthDate
        profileImageUrl
        recentWeight {
          value
          recordedAt
        }
        todayRecordCount
        totalHealthRecordCount
        recentHealthRecords(limit: 5) {
          id
          type
          recordedAt
          numValue
          textValue
        }
      }
      upcomingSchedules(limit: 3) {
        id
        petId
        petName
        petProfileImageUrl
        type
        title
        dueDate
      }
    }
  }
`;
