import { gql } from '@/generated/gql';

export const CALENDAR_QUERY = gql(`
  query CalendarQuery($startDate: String!, $endDate: String!) {
    me {
      pets {
        id
        name
        profileImageUrl
      }
      calendarEvents(startDate: $startDate, endDate: $endDate) {
        id
        date
        type
        title
        subtitle
        petId
      }
    }
  }
`);
