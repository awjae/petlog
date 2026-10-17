import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'dog-weight-check';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function DogWeightCheckGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>집에서 체중 재는 법</h2>
        <p className={styles.paragraph}>
          소형견이나 고양이는 전용 저울이 없어도 됩니다. 사람이 먼저 올라가 몸무게를 재고, 아이를
          안고 다시 올라간 뒤 두 값을 빼면 됩니다. 중·대형견은 바닥에 평평하게 놓이는 체중계 위에 네
          발이 모두 올라가도록 유도하고, 움직임이 멈춘 뒤의 값을 읽습니다.
        </p>
        <p className={styles.paragraph}>
          숫자 하나보다 중요한 건 <strong>매번 같은 조건에서 재는 것</strong>입니다. 조건이 바뀌면
          실제 변화인지 측정 차이인지 구분할 수 없습니다.
        </p>
        <ul className={styles.list}>
          <li>같은 저울을 씁니다. 저울마다 수백 g씩 차이가 납니다.</li>
          <li>아침 식사 전, 배변 후처럼 하루 중 같은 시점을 고릅니다.</li>
          <li>목줄·옷·하네스는 벗기거나, 매번 똑같이 착용한 상태로 잽니다.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>얼마나 자주 재야 할까</h2>
        <p className={styles.paragraph}>
          건강한 성견·성묘는 <strong>주 1회</strong>면 충분합니다. 매일 재면 식사량과 배변에 따른
          하루 단위 출렁임까지 같이 기록돼 오히려 추세가 보이지 않습니다.
        </p>
        <p className={styles.paragraph}>
          성장기이거나, 다이어트 중이거나, 수의사가 체중을 지켜보자고 한 상황이라면 주 2~3회로
          늘리고 같은 요일·같은 시간을 유지하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>어느 정도 변화부터 상담해야 할까</h2>
        <p className={styles.paragraph}>
          일반적으로 <strong>의도하지 않은 체중의 5% 이상 변화</strong>는 눈여겨볼 신호로 봅니다.
          5kg인 아이라면 250g, 20kg인 아이라면 1kg입니다. 특히 식사량을 줄이지 않았는데 몇 주에 걸쳐
          줄어드는 경우가 그렇습니다.
        </p>
        <p className={styles.paragraph}>
          반대로 늘어나는 쪽도 같습니다. 체중 증가는 관절과 심장에 부담을 주고, 당뇨 같은 질환의
          위험을 높입니다. 체중만 따로 보지 말고 식욕·활동량·음수량 기록을 함께 보면 변화의 맥락이
          드러납니다.
        </p>
        <p className={styles.note}>
          여기 적은 기준은 일반적인 참고 범위입니다. 품종·나이·기저질환에 따라 적정 체중과 위험
          구간이 다르므로, 변화가 보이면 수의사와 상담하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기록이 쌓여야 보이는 것</h2>
        <p className={styles.paragraph}>
          체중은 한 번 잰 값으로는 아무것도 말해주지 않습니다. 같은 조건에서 몇 주, 몇 달 쌓였을 때
          비로소 &quot;줄고 있다&quot;거나 &quot;지난 달부터 멈췄다&quot;를 말할 수 있습니다. 진료
          중에 &quot;언제부터 그랬나요&quot;라는 질문에 답할 수 있는 것도 기록이 있을 때입니다.
        </p>
      </section>
    </GuideArticle>
  );
}
