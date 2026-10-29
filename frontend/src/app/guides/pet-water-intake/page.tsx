import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'pet-water-intake';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetWaterIntakeGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>하루에 얼마나 마시면 정상일까</h2>
        <p className={styles.paragraph}>
          개는 일반적으로 <strong>체중 1kg당 하루 50~60mL</strong> 정도를 마십니다. 5kg인 아이라면
          250~300mL, 10kg인 아이라면 500~600mL입니다. 고양이는 개보다 적게 마시는 편이고, 습식
          사료를 먹으면 음식으로 수분을 얻어 그릇의 물은 더 줄어듭니다.
        </p>
        <p className={styles.paragraph}>
          개·고양이 모두 <strong>체중 1kg당 하루 100mL를 넘게</strong> 마시는 상태가 이어지면 많이
          마시는 것(다음)으로 봅니다. 다음은 신장·내분비 질환에서 흔히 먼저 보이는 신호라, 보호자가
          가장 일찍 알아챌 수 있는 변화 중 하나입니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>집에서 음수량 재는 법</h2>
        <p className={styles.paragraph}>
          아침에 계량컵으로 정해진 양(예: 1,000mL)을 물그릇에 붓고, 다음 날 같은 시각에 남은 양을
          잽니다. 부은 양에서 남은 양을 빼면 하루 음수량입니다.
        </p>
        <ul className={styles.list}>
          <li>물그릇이 여러 개라면 전부 같은 방식으로 재서 더합니다.</li>
          <li>
            증발량을 보려면 아이가 닿지 않는 곳에 같은 그릇을 하나 더 두고 줄어든 만큼 빼줍니다.
          </li>
          <li>여러 마리를 키우면 한 마리만 따로 재기 어렵습니다. 이때는 합계의 변화를 봅니다.</li>
          <li>산책 중에 마신 물, 습식 사료·간식의 수분은 들어가지 않는다는 점을 감안합니다.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>하루 값보다 흐름이 중요하다</h2>
        <p className={styles.paragraph}>
          덥거나 많이 뛰어논 날은 당연히 더 마십니다. 하루 값 하나로 판단하지 말고, 같은 방식으로
          며칠 재서 평소 수준을 먼저 알아두세요. 그 평소보다 눈에 띄게 많은 날이 계속되는지가 중요한
          정보입니다.
        </p>
        <p className={styles.paragraph}>
          물을 많이 마시면 소변량도 함께 늘어납니다. 배변 패드가 평소보다 빨리 차거나, 실내 실수가
          늘었다면 음수량과 같이 남겨두세요.
        </p>
        <p className={styles.note}>
          이 글은 기록을 남기기 위한 참고 정보이며 진단이 아닙니다. 체중 1kg당 하루 100mL 넘게
          마시는 날이 이어지거나, 반대로 하루 종일 물을 거의 마시지 않으면 수의사와 상담하세요.
        </p>
      </section>
    </GuideArticle>
  );
}
