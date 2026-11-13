import type { Metadata } from 'next';
import { ToolPage } from '../ToolPage';
import { findTool } from '../tools';
import { PetAgeCalculator } from './PetAgeCalculator';
import styles from '../../guides/page.module.css';

const SLUG = 'pet-age';
const tool = findTool(SLUG);

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
};

export default function PetAgeToolPage() {
  return (
    <ToolPage slug={SLUG}>
      <PetAgeCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>&quot;1살 = 사람 7살&quot;이 틀린 이유</h2>
        <p className={styles.paragraph}>
          개와 고양이는 태어나 첫 1~2년 동안 사람보다 훨씬 빨리 자랍니다. 생후 1년이면 이미 사람
          청소년기에 해당하고, 2년이면 20대 중반쯤입니다. 그 뒤로는 속도가 느려져 매년 일정한 나이씩
          늘어납니다. 그래서 단순히 7을 곱하면 어릴 때는 너무 적게, 나이 들어서는 다르게 계산됩니다.
        </p>
        <p className={styles.paragraph}>
          강아지는 체구가 클수록 빨리 늙습니다. 같은 10살이라도 대형견은 소형견보다 사람 나이로 훨씬
          많습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>나이에 따라 기록할 것이 달라진다</h2>
        <p className={styles.paragraph}>
          사람 나이로 50대에 들어서는 시기(소형견·고양이 약 7살, 대형견 약 5살)부터는 노령기로 보고
          정기 검진 간격을 줄이는 경우가 많습니다. 체중, 음수량, 식욕처럼 집에서 매일 볼 수 있는
          변화를 꾸준히 남겨두면 검진 때 이야기할 근거가 됩니다.
        </p>
        <p className={styles.note}>
          계산 결과는 평균적인 추정치이며, 품종·건강 상태에 따라 실제 노화 속도는 다릅니다.
        </p>
      </section>
    </ToolPage>
  );
}
