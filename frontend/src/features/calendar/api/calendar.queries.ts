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

export const CALENDAR_QUERY: TypedDocumentNode<CalendarQueryResult, CalendarQueryVariables> = gql`
  query CalendarQuery($startDate: String!, $endDate: String!) {
    me {
      # id 없이 조회하면 캐시에서 ROOT_QUERY.me 자리를 두고 다른 me 쿼리와 충돌한다
      # (settings.queries.ts의 주석 참고).
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
