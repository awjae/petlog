import { setupWorker } from 'msw/browser';
import { homeHandlers } from './handlers/home';
import { authHandlers } from './handlers/auth';
import { calendarHandlers } from './handlers/calendar';
import { healthRecordHandlers } from './handlers/health-record';
import { medicalHandlers } from './handlers/medical';
import { petHandlers } from './handlers/pet';
import { reportHandlers } from './handlers/report';

export const worker = setupWorker(
  ...homeHandlers,
  ...authHandlers,
  ...calendarHandlers,
  ...healthRecordHandlers,
  ...medicalHandlers,
  ...petHandlers,
  ...reportHandlers,
);
