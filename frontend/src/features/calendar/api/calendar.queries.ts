import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import type { CalendarEvent, CalendarPet } from '../types/calendar.types';

type CalendarQueryResult = {
  me: {
    id: string;
    pets: CalendarPet[];
    calendarEvents: CalendarEvent[];
  } | null;
};

type CalendarQueryVariables = {
  startDate: string;
  endDate: string;
};

// me의 id는 캐시 정규화에 필요하다(이유는 settings.queries.ts 주석 참고).
export const CALENDAR_QUERY: TypedDocumentNode<CalendarQueryResult, CalendarQueryVariables> = gql`
  query CalendarQuery($startDate: String!, $endDate: String!) {
    me {
      id
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
        recordType
        numValue
        textValue
        petId
      }
    }
  }
`;
