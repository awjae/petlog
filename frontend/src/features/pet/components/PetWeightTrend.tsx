import { toChartCoords, type WeightTrend } from '../utils/weightTrend';
import { formatShortDate } from '../utils/petMeta';
import styles from './PetWeightTrend.module.css';

const WIDTH = 300;
const HEIGHT = 96;
const PADDING = 8;

interface PetWeightTrendProps {
  trend: WeightTrend | null;
  error: boolean;
}

// 증감에 좋고 나쁨의 색을 입히지 않는다 — 체중이 늘어난 게 좋은지는 반려동물마다 달라
// 판단은 보호자와 수의사의 몫이다.
function formatChange(change: number): string {
  if (change === 0) return '변화 없음';
  return `${change > 0 ? '+' : ''}${change}kg`;
}

export function PetWeightTrend({ trend, error }: PetWeightTrendProps) {
  return (
    <section className={styles.section} aria-label="체중 변화">
      <div className={styles.header}>
        <h3 className={styles.title}>체중 변화</h3>
        {trend && (
          <span className={styles.change}>
            최근 {trend.points.length}회 {formatChange(trend.change)}
          </span>
        )}
      </div>

      <div className={styles.card}>
        {error ? (
          <p className={styles.message}>체중 기록을 불러오지 못했어요</p>
        ) : !trend ? (
          <p className={styles.message}>체중을 2번 이상 기록하면 변화를 볼 수 있어요</p>
        ) : (
          <TrendChart trend={trend} />
        )}
      </div>
    </section>
  );
}

function TrendChart({ trend }: { trend: WeightTrend }) {
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
        aria-label={`체중 ${first.value}kg에서 ${last.value}kg으로 변화`}
      >
        <polyline
          className={styles.line}
          points={coords.map(({ x, y }) => `${x},${y}`).join(' ')}
        />
        {/* 같은 날 기록은 recordedAt이 같아 키로 쓰면 중복된다. 점 목록은 순서만 있는 정적 렌더라 인덱스로 충분하다. */}
        {coords.map(({ x, y }, index) => (
          <circle key={index} className={styles.dot} cx={x} cy={y} r={3} />
        ))}
      </svg>
      <div className={styles.axis} aria-hidden="true">
        <span>
          {formatShortDate(first.recordedAt)} · {first.value}kg
        </span>
        <span>
          {formatShortDate(last.recordedAt)} · {last.value}kg
        </span>
      </div>
    </>
  );
}
