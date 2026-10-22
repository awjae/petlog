import type { Metadata } from 'next';
import Link from 'next/link';
import { ReportCover } from '@/features/report/components/ReportCover';
import { ReportHeadline } from '@/features/report/components/ReportHeadline';
import { ReportDetailSection } from '@/features/report/components/ReportDetailSection';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'AI 건강 리포트 예시',
  description:
    '기록이 쌓이면 이런 리포트를 받아요. 가입 전에 Petlog AI 건강 리포트가 어떤 모습인지 미리 확인해보세요.',
};

// 가입 전에 리포트가 어떤 모습인지 보여주는 고정 예시. 실제 사용자 데이터가 아니며,
// 상세 화면(app/reports/[reportId])과 같은 컴포넌트를 써서 실제 결과물과 어긋나지 않게 한다.
const SAMPLE = {
  petName: '보리 (예시)',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  createdAt: '2026-10-01T09:00:00+09:00',
  overview:
    '한 달 동안 체중은 거의 변하지 않았고, 산책 횟수는 지난달보다 늘었어요. 식사량은 후반부에 조금 줄었습니다.',
  highlights: [
    '체중이 4.9kg → 5.0kg으로 안정적으로 유지됐어요',
    '주 평균 산책이 4회에서 5회로 늘었어요',
  ],
  concerns: ['마지막 주 식사 기록이 이전 3주보다 적어요. 지켜보면 좋겠어요'],
  recommendations: [
    '식사량 기록을 며칠 더 이어가며 변화를 확인해보세요',
    '다음 정기 접종일이 다가오고 있어요',
  ],
};

export default function SampleReportPage() {
  return (
    <main className={styles.main} aria-label="AI 건강 리포트 예시">
      <p className={styles.banner}>예시 화면이에요. 실제 반려동물의 기록이 아닙니다.</p>

      <div className={styles.content}>
        <ReportCover
          generatedBy="ai"
          periodStart={SAMPLE.periodStart}
          periodEnd={SAMPLE.periodEnd}
          petName={SAMPLE.petName}
          createdAt={SAMPLE.createdAt}
        />
        <div className={styles.headlineWrap}>
          <ReportHeadline overview={SAMPLE.overview} hasOtherContent />
        </div>
        <div className={styles.sections}>
          <ReportDetailSection type="highlights" content={SAMPLE.highlights} order={1} />
          <ReportDetailSection type="concerns" content={SAMPLE.concerns} order={2} />
          <ReportDetailSection type="recommendations" content={SAMPLE.recommendations} order={3} />
        </div>
        <p className={styles.disclaimer}>
          리포트는 건강 기록을 바탕으로 한 참고 정보이며 의료적 진단이나 치료를 대체하지 않습니다.
        </p>
      </div>

      <div className={styles.cta}>
        <Link href="/register" className={styles.ctaBtn}>
          우리 아이 리포트 받아보기
        </Link>
        <Link href="/" className={styles.back}>
          Petlog 소개로 돌아가기
        </Link>
      </div>
    </main>
  );
}
