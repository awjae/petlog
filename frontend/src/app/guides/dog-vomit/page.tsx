import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'dog-vomit';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function DogVomitGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>바로 병원에 가야 하는 경우</h2>
        <p className={styles.paragraph}>
          아래에 해당하면 기록보다 진료가 먼저입니다. 기록은 병원으로 가는 길에 남겨도 됩니다.
        </p>
        <ul className={styles.list}>
          <li>토사물에 피가 섞여 있거나 커피 찌꺼기처럼 검은 것이 보일 때</li>
          <li>하루에 여러 번 반복하거나, 물만 마셔도 토할 때</li>
          <li>축 처지고 기운이 없거나, 배가 부풀어 오르고 아파할 때</li>
          <li>토하려고 하는데 아무것도 나오지 않을 때 (특히 대형견)</li>
          <li>장난감·뼈·끈 같은 이물을 삼켰을 가능성이 있을 때</li>
          <li>어린 강아지·노령견이거나 지병이 있을 때</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>무엇을 기록해야 할까</h2>
        <p className={styles.paragraph}>
          진료실에서 수의사가 묻는 질문은 거의 정해져 있습니다. 토한 직후에는 기억이 생생하지만 며칠
          지나면 흐려지니, 그 자리에서 아래 네 가지를 남겨두세요.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>언제</strong>: 날짜와 시각, 그리고 식사 후 얼마나 지나서였는지
          </li>
          <li>
            <strong>몇 번</strong>: 한 번인지, 하루에 여러 번인지
          </li>
          <li>
            <strong>무엇을</strong>: 소화되지 않은 사료, 풀이나 이물질, 노란 액체, 흰 거품, 피
          </li>
          <li>
            <strong>그 밖의 변화</strong>: 식욕, 기운, 설사 여부
          </li>
        </ul>
        <p className={styles.paragraph}>
          가능하다면 토사물 사진도 찍어두세요. 색과 내용물을 말로 설명하는 것보다 정확합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>한 번 토했다면</h2>
        <p className={styles.paragraph}>
          급하게 먹었거나 풀을 먹은 뒤 한 번 토하고, 이후 밥을 잘 먹고 기운도 평소와 같다면 지켜볼
          수 있는 경우가 많습니다. 다만 &quot;한 번&quot;이 몇 주에 걸쳐 반복된다면 이야기가
          달라집니다. 한 달에 몇 번 토했는지는 기록이 없으면 아무도 정확히 답하지 못합니다.
        </p>
        <p className={styles.note}>
          이 글은 기록을 남기기 위한 참고 정보이며 진단이 아닙니다. 위의 &quot;바로 병원에 가야 하는
          경우&quot;에 해당하지 않더라도 걱정된다면 수의사와 상담하세요.
        </p>
      </section>
    </GuideArticle>
  );
}
