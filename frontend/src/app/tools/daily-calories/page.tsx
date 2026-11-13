import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolPage } from '../ToolPage';
import { findTool } from '../tools';
import { DailyCaloriesCalculator } from './DailyCaloriesCalculator';
import styles from '../../guides/page.module.css';

const SLUG = 'daily-calories';
const tool = findTool(SLUG);

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
};

export default function DailyCaloriesToolPage() {
  return (
    <ToolPage slug={SLUG}>
      <DailyCaloriesCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>어떻게 계산하나요</h2>
        <p className={styles.paragraph}>
          수의 영양학에서 쓰는 표준 계산입니다. 먼저 쉬고 있을 때 필요한 에너지(휴식 에너지 요구량,
          RER = 70 × 체중<sup>0.75</sup>)를 구하고, 나이·중성화 여부·활동량에 따라 정해진 계수를
          곱합니다. 같은 체중이라도 성장기 강아지는 성견보다 두 배 가까이 필요합니다.
        </p>
        <p className={styles.paragraph}>
          급여량은 사료 포장에 적힌 칼로리(kcal/kg)로 나눠 구합니다. 간식도 칼로리에 포함되므로,
          간식을 자주 준다면 그만큼 사료를 줄여야 합니다. 보통 간식은 하루 칼로리의 10%를 넘기지
          않도록 권합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>숫자보다 체중 변화를 보세요</h2>
        <p className={styles.paragraph}>
          계산값은 시작점일 뿐이고 개체마다 차이가 큽니다. 계산한 양으로 2~4주 급여하면서 체중을
          재보고, 늘면 줄이고 줄면 늘리는 것이 실제로 맞는 양을 찾는 방법입니다.{' '}
          <Link href="/guides/dog-weight-check">체중 재는 법</Link>도 함께 확인해보세요.
        </p>
        <p className={styles.note}>
          이 계산은 건강한 반려동물을 위한 일반적인 참고값입니다. 지병이 있거나 처방식을 먹는 경우,
          감량 중인 경우에는 수의사가 정해준 양을 따르세요.
        </p>
      </section>
    </ToolPage>
  );
}
