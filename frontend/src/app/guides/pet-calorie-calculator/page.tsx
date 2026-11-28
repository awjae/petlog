import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';
import { PetCalorieCalculator } from './PetCalorieCalculator';

const SLUG = 'pet-calorie-calculator';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetCalorieCalculatorGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <PetCalorieCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>어떻게 계산하나요</h2>
        <p className={styles.paragraph}>
          수의 영양학에서는 먼저 쉬고 있을 때 쓰는 에너지(RER)를 구합니다. 식은{' '}
          <strong>70 × 체중(kg)의 0.75제곱</strong>입니다. 여기에 나이·중성화 여부·체중 목표에 따른
          계수를 곱한 값이 하루 권장 칼로리입니다.
        </p>
        <ul className={styles.list}>
          <li>중성화한 성견 1.6배, 중성화하지 않은 성견 1.8배</li>
          <li>중성화한 성묘 1.2배, 중성화하지 않은 성묘 1.4배</li>
          <li>성장기 강아지 2~3배, 성장기 고양이 2.5배</li>
          <li>체중 감량 중에는 강아지 1.0배, 고양이 0.8배 (목표 체중 기준으로 계산)</li>
        </ul>
        <p className={styles.paragraph}>
          사료 포장지 뒷면의 &quot;대사 에너지(kcal/kg)&quot;를 넣으면 하루 급여량을 g으로 바꿔
          보여드려요. 간식을 준다면 하루 칼로리의 10% 안쪽으로 두고 그만큼 사료를 줄입니다.
        </p>
        <p className={styles.note}>
          계산값은 시작점일 뿐입니다. 같은 체중이라도 활동량·품종·체질에 따라 필요량이 20% 이상 차이
          나기도 합니다. 질환이 있거나 처방식을 먹고 있다면 수의사가 정한 양을 따르세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>급여량이 맞는지 확인하는 법</h2>
        <p className={styles.paragraph}>
          정답은 체중 추이에 있습니다. 계산한 양으로 2~4주 급여하면서 주 1회 같은 조건으로 체중을
          재세요. 의도하지 않았는데 체중이 꾸준히 늘거나 줄면 급여량을 10% 정도씩 조정합니다.
        </p>
        <p className={styles.paragraph}>
          식사 기록을 체중 기록과 함께 남겨두면 &quot;사료를 바꾼 뒤부터 늘었다&quot;처럼 원인을
          짚기 쉬워지고, 병원에서 식이 상담을 받을 때도 그대로 보여줄 수 있습니다.
        </p>
      </section>
    </GuideArticle>
  );
}
