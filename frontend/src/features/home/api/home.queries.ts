// filepath: src/features/home/api/home.queries.ts

import { gql } from '@apollo/client';
import type { DocumentNode } from 'graphql';

export const HOME_QUERY: DocumentNode = gql`
  query HomeQuery {
    me {
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
        recentHealthRecords(limit: 3) {
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
