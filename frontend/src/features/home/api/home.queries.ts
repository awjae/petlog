import { gql } from '@/generated/gql';

export const HOME_QUERY = gql(`
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
`);
