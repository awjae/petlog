import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';
import { PetAgeCalculator } from './PetAgeCalculator';

const SLUG = 'pet-age-calculator';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetAgeCalculatorGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <PetAgeCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>어떻게 계산하나요</h2>
        <p className={styles.paragraph}>
          흔히 말하는 &quot;1년 = 사람 7년&quot;은 실제와 잘 맞지 않습니다. 강아지와 고양이는 첫
          1~2년에 사람보다 훨씬 빨리 자라고, 그 뒤로는 천천히 나이를 먹습니다. 그래서 수의계에서는
          보통 아래처럼 환산합니다.
        </p>
        <ul className={styles.list}>
          <li>첫 1년: 사람 나이 약 15세</li>
          <li>2년: 약 24세</li>
          <li>그 뒤 1년마다: 소형견·고양이 약 4세, 중형견 약 4.5세, 대형견 약 5.5세씩 더합니다</li>
        </ul>
        <p className={styles.paragraph}>
          개는 몸집이 클수록 수명이 짧고 빨리 늙습니다. 같은 10살이라도 소형견은 사람 50대 중반,
          대형견은 60대 후반에 가깝습니다.
        </p>
        <p className={styles.note}>
          여기 나오는 값은 생애 단계를 가늠하기 위한 참고치입니다. 실제 노화 속도는 품종·체중·건강
          상태에 따라 다르므로, 건강검진 주기는 수의사와 상담해 정하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>나이가 들수록 기록이 중요한 이유</h2>
        <p className={styles.paragraph}>
          사람 나이로 40~50대에 접어들면 체중·음수량·식욕의 작은 변화가 질환의 첫 신호인 경우가
          늘어납니다. 반려동물은 아프다고 말하지 못하니, 평소 값을 꾸준히 남겨둬야 &quot;요즘 물을
          많이 마신다&quot;처럼 달라진 점을 알아차릴 수 있습니다.
        </p>
        <p className={styles.paragraph}>
          노령기에는 보통 1년에 한 번이던 건강검진을 6개월마다로 당기기도 합니다. 그 사이의 기록을
          가져가면 진료 시간이 짧아도 수의사가 변화를 함께 볼 수 있습니다.
        </p>
      </section>
    </GuideArticle>
  );
}
