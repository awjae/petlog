import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'pet-temperature';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetTemperatureGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>정상 체온 범위</h2>
        <p className={styles.paragraph}>
          개와 고양이의 정상 체온은 <strong>38.0~39.2°C</strong>로, 사람(약 36.5°C)보다 높습니다.
          몸이 따뜻하게 느껴진다고 해서 열이 있는 것은 아닙니다.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>39.5°C 이상</strong>: 발열을 의심할 수 있는 구간입니다.
          </li>
          <li>
            <strong>37.5°C 이하</strong>: 저체온 쪽으로, 발열만큼이나 위험한 신호입니다.
          </li>
        </ul>
        <p className={styles.paragraph}>
          단, 흥분했거나 더운 곳에 있다가 바로 재면 일시적으로 올라갑니다. 10~15분 안정된 뒤 다시
          재보고 판단하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>집에서 체온 재는 법</h2>
        <p className={styles.paragraph}>
          가장 정확한 방법은 직장(항문) 체온 측정입니다. 전자 체온계 끝에 수용성 젤을 바르고 1~2cm
          정도만 부드럽게 넣은 뒤 신호음이 울릴 때까지 기다립니다. 혼자 하기 어려우면 한 명이 아이를
          가볍게 안아 지지해 주세요.
        </p>
        <p className={styles.paragraph}>
          귀 체온계는 거부감이 적지만 귀 모양과 각도에 따라 값이 흔들립니다. 쓰더라도 매번 같은 쪽
          귀로, 같은 방식으로 재야 비교할 수 있는 기록이 됩니다.
        </p>
        <ul className={styles.list}>
          <li>사람용 수은 체온계는 부러질 위험이 있어 쓰지 않습니다.</li>
          <li>이마·비접촉 체온계는 털 때문에 반려동물에게 신뢰할 수 없습니다.</li>
          <li>잰 방식(직장/귀)을 기록에 같이 남기면 나중에 값을 비교할 수 있습니다.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>범위를 벗어났을 때</h2>
        <p className={styles.paragraph}>
          체온이 범위를 벗어났다면 숫자 하나만 보지 말고 다른 신호를 함께 확인하세요. 기운이 없는지,
          밥을 먹는지, 구토·설사가 있는지, 호흡이 빠른지가 중요한 정보입니다.
        </p>
        <p className={styles.note}>
          이 글은 기록을 남기기 위한 참고 정보이며 진단이 아닙니다. 체온이 39.5°C 이상이거나 37.5°C
          이하로 측정되면, 특히 다른 증상이 함께 보이면 바로 수의사와 상담하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>언제 재서 남겨야 할까</h2>
        <p className={styles.paragraph}>
          건강할 때는 매일 잴 필요가 없습니다. 다만 평소 체온을 두세 번이라도 재서 남겨두면, 아플 때
          잰 값이 이 아이 기준으로 높은지 낮은지 판단할 근거가 생깁니다. 아픈 날에는 같은 방식 으로
          아침·저녁 두 번 재서 흐름을 남기면 진료 때 그대로 쓸 수 있습니다.
        </p>
      </section>
    </GuideArticle>
  );
}
