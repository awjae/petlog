import type { HealthRecordType } from '@/generated/graphql';
import { TYPE_LABEL, buildSummary } from '@/features/health-record/types/health-record.types';
import { TREND_DAYS, toChartCoords, type RecordTrend } from '../utils/recordTrend';
import { formatShortDate } from '../utils/petMeta';
import styles from './PetRecordTrend.module.css';

const WIDTH = 300;
const HEIGHT = 96;
const PADDING = 8;

interface PetRecordTrendProps {
  type: HealthRecordType;
  trend: RecordTrend | null;
  error: boolean;
}

// 단위는 기록 목록과 같은 표기(buildSummary)를 쓴다.
function formatValue(type: HealthRecordType, value: number): string {
  return buildSummary(type, value, null);
}

// 증감에 좋고 나쁨의 색을 입히지 않는다 — 체중이 늘어난 게 좋은지, 혈당이 내려간 게
// 좋은지는 반려동물마다 달라 판단은 보호자와 수의사의 몫이다.
function formatChange(type: HealthRecordType, change: number): string {
  if (change === 0) return '변화 없음';
  return `${change > 0 ? '+' : ''}${formatValue(type, change)}`;
}

export function PetRecordTrend({ type, trend, error }: PetRecordTrendProps) {
  const label = TYPE_LABEL[type];
  return (
    <section className={styles.section} aria-label={`${label} 변화`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{label} 변화</h3>
        {trend && (
          <span className={styles.change}>
            최근 {TREND_DAYS}일 {formatChange(type, trend.change)}
          </span>
        )}
      </div>

      <div className={styles.card}>
        {error ? (
          <p className={styles.message}>{label} 기록을 불러오지 못했어요</p>
        ) : !trend ? (
          <p className={styles.message}>
            최근 {TREND_DAYS}일 동안 {label}을 이틀 이상 기록하면 변화를 볼 수 있어요
          </p>
        ) : (
          <TrendChart type={type} trend={trend} />
        )}
      </div>
    </section>
  );
}

function TrendChart({ type, trend }: { type: HealthRecordType; trend: RecordTrend }) {
  const { points } = trend;
  const first = points[0];
  const last = points[points.length - 1];
  const coords = toChartCoords(points, WIDTH, HEIGHT, PADDING);

  return (
    <>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.chart}
        role="img"
        aria-label={`${TYPE_LABEL[type]} ${formatValue(type, first.value)}에서 ${formatValue(type, last.value)}로 변화`}
      >
        <polyline
          className={styles.line}
          points={coords.map(({ x, y }) => `${x},${y}`).join(' ')}
        />
        {/* 점 목록은 순서만 있는 정적 렌더라 인덱스로 충분하다. */}
        {coords.map(({ x, y }, index) => (
          <circle key={index} className={styles.dot} cx={x} cy={y} r={3} />
        ))}
      </svg>
      <div className={styles.axis} aria-hidden="true">
        <span>
          {formatShortDate(first.recordedAt)} · {formatValue(type, first.value)}
        </span>
        <span>
          {formatShortDate(last.recordedAt)} · {formatValue(type, last.value)}
        </span>
      </div>
    </>
  );
}
