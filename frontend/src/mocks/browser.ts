import { setupWorker } from 'msw/browser';
import { homeHandlers } from './handlers/home';
import { authHandlers } from './handlers/auth';
import { calendarHandlers } from './handlers/calendar';

export const worker = setupWorker(...homeHandlers, ...authHandlers, ...calendarHandlers);
