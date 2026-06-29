import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { CalendarEvent, CalendarPet } from '../types/calendar.types';

type CalendarQueryResult = {
  me: {
    pets: CalendarPet[];
    calendarEvents: CalendarEvent[];
  } | null;
};

type CalendarQueryVariables = {
  startDate: string;
  endDate: string;
};

export const CALENDAR_QUERY: TypedDocumentNode<CalendarQueryResult, CalendarQueryVariables> = gql`
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
`;
