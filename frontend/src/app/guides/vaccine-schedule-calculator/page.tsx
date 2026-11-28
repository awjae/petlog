import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';
import { VaccineScheduleCalculator } from './VaccineScheduleCalculator';

const SLUG = 'vaccine-schedule-calculator';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function VaccineScheduleCalculatorGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <VaccineScheduleCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기초 접종은 왜 여러 번 맞나요</h2>
        <p className={styles.paragraph}>
          어린 강아지·고양이는 엄마에게 받은 항체(모체이행항체)를 갖고 태어납니다. 이 항체가 남아
          있는 동안에는 백신을 맞아도 면역이 잘 생기지 않고, 항체가 언제 사라지는지는 아이마다
          다릅니다. 그래서 2~4주 간격으로 여러 번 맞혀 빈틈을 메웁니다.
        </p>
        <ul className={styles.list}>
          <li>
            강아지: 생후 6~8주에 시작해 2~3주 간격으로 종합백신 5회, 그 사이 코로나
            장염·켄넬코프·인플루엔자
          </li>
          <li>고양이: 생후 8주쯤 시작해 3~4주 간격으로 종합백신 3회</li>
          <li>광견병: 생후 3개월 이후 1회</li>
          <li>기초 접종이 끝나면 보통 1년마다 추가 접종합니다</li>
        </ul>
        <p className={styles.note}>
          위 일정은 국내 동물병원에서 흔히 안내하는 순서를 바탕으로 한 참고용입니다. 시작 시기와
          간격, 포함하는 백신은 병원·아이의 건강 상태·생활 환경에 따라 달라지니 실제 일정은 수의사와
          정하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>접종 후 기록해둘 것</h2>
        <p className={styles.paragraph}>
          접종 날짜와 백신 이름, 다음 접종 예정일은 꼭 남겨두세요. 병원을 옮기거나 미용·호텔을
          이용할 때 접종 이력을 묻는 경우가 많습니다. 접종 당일과 다음 날에는 식욕·활동량·접종
          부위의 붓기를 함께 적어두면, 다음 접종 때 수의사가 반응을 참고할 수 있습니다.
        </p>
        <p className={styles.paragraph}>
          Petlog에 접종을 기록하면 다음 접종 예정일 당일에 알림으로 알려드려요.
        </p>
      </section>
    </GuideArticle>
  );
}
