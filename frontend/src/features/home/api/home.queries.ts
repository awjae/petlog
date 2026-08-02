import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { HomeQueryQuery, HomeQueryQueryVariables } from '@/generated/graphql';

// me의 id는 캐시 정규화에 필요하다(이유는 settings.queries.ts 주석 참고).
export const HOME_QUERY: TypedDocumentNode<HomeQueryQuery, HomeQueryQueryVariables> = gql`
  query HomeQuery {
    me {
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
