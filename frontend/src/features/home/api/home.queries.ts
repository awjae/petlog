import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { HomeQueryQuery, HomeQueryQueryVariables } from '@/generated/graphql';

export const HOME_QUERY: TypedDocumentNode<HomeQueryQuery, HomeQueryQueryVariables> = gql`
  query HomeQuery {
    me {
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
        recentHealthRecords(limit: 5) {
          id
          type
          recordedAt
          summary
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
