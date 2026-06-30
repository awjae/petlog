'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FlaskConical } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useReport } from '@/features/report/hooks/useReport';
import { ReportDetailSection } from '@/features/report/components/ReportDetailSection';
import { ReportDetailSkeleton } from '@/features/report/components/ReportSkeleton';
import { PETS_FOR_REPORT_QUERY } from '@/features/report/api/report.queries';
import styles from './page.module.css';

function formatPeriodRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  const sm = s.getMonth() + 1;
  const em = e.getMonth() + 1;
  const sd = s.getDate();
  const ed = e.getDate();
  if (sy === ey && sm === em) {
    return `${sy}년 ${sm}월 ${sd}일 ~ ${ed}일`;
  }
  return `${sy}.${String(sm).padStart(2, '0')}.${String(sd).padStart(2, '0')} ~ ${String(em).padStart(2, '0')}.${String(ed).padStart(2, '0')}`;
}

export default function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const { reportId } = use(params);

  const { report, loading, error } = useReport(reportId);

  const { data: petsData } = useQuery(PETS_FOR_REPORT_QUERY, {
    fetchPolicy: 'cache-first',
  });
  const pets = petsData?.me?.pets ?? [];
  const petName = pets.find((p) => p.id === report?.petId)?.name ?? '';

  if (loading) {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="뒤로"
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className={styles.title}>리포트</h1>
          <div className={styles.headerSpacer} aria-hidden="true" />
        </header>
        <ReportDetailSkeleton />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className={styles.main} aria-label="리포트 상세">
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="뒤로"
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className={styles.title}>리포트</h1>
          <div className={styles.headerSpacer} aria-hidden="true" />
        </header>
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>리포트를 불러올 수 없어요</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요</p>
          <button className={styles.retryBtn} onClick={() => router.back()}>
            돌아가기
          </button>
        </div>
      </main>
    );
  }

  const subtitle = [petName, formatPeriodRange(report.periodStart, report.periodEnd)]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className={styles.main} aria-label="리포트 상세">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>리포트</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <div className={styles.content}>
        {report.generatedBy === 'mock' && (
          <div className={styles.mockBadgeWrap}>
            <span className={styles.mockBadge}>
              <FlaskConical size={12} strokeWidth={2} aria-hidden="true" />
              테스트 리포트
            </span>
          </div>
        )}

        <div className={styles.sections}>
          <ReportDetailSection type="overview" content={report.overview} />
          <ReportDetailSection type="highlights" content={report.highlights} />
          <ReportDetailSection type="concerns" content={report.concerns} />
          <ReportDetailSection type="recommendations" content={report.recommendations} />
        </div>

        <p className={styles.disclaimer}>
          이 리포트는 건강 기록을 바탕으로 한 참고 정보입니다. 의료적 진단이나 치료를 대체하지
          않습니다. 건강 이상이 의심되면 수의사와 상담하세요.
        </p>
      </div>
    </main>
  );
}
