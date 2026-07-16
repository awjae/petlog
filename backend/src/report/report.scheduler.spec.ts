import { ReportScheduler } from './report.scheduler';
import { ReportService } from './report.service';

describe('ReportScheduler', () => {
  it('스케줄 실행 시 ReportService.cleanupStaleReports를 호출한다', async () => {
    const reportService = { cleanupStaleReports: jest.fn().mockResolvedValue(undefined) };
    const scheduler = new ReportScheduler(reportService as unknown as ReportService);

    await scheduler.handleStaleReportCleanup();

    expect(reportService.cleanupStaleReports).toHaveBeenCalledTimes(1);
  });
});
