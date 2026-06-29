import { graphql, HttpResponse } from 'msw';
import { mockCalendarData } from '../data/calendar';

export const calendarHandlers = [
  graphql.query('CalendarQuery', ({ variables }) => {
    const { startDate, endDate } = variables as { startDate: string; endDate: string };

    const filtered = {
      ...mockCalendarData,
      me: {
        ...mockCalendarData.me,
        calendarEvents: mockCalendarData.me.calendarEvents.filter((e: { date: string }) => {
          const d = e.date.slice(0, 10);
          return d >= startDate && d <= endDate;
        }),
      },
    };

    return HttpResponse.json({ data: filtered });
  }),
];
