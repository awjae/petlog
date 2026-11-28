import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'dog-diarrhea';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function DogDiarrheaGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>바로 병원에 가야 하는 경우</h2>
        <p className={styles.paragraph}>
          설사 자체는 흔하지만, 아래에 해당하면 지켜보지 말고 진료를 먼저 받으세요.
        </p>
        <ul className={styles.list}>
          <li>변에 선홍색 피가 많이 섞이거나, 짜장처럼 검고 끈적한 변을 볼 때</li>
          <li>구토를 함께 하거나, 물을 마시지 못할 때</li>
          <li>축 처지고 기운이 없거나, 배를 만지면 아파할 때</li>
          <li>하루 넘게 물 같은 설사가 이어질 때</li>
          <li>잇몸이 끈적하고 피부를 집었다 놓았을 때 늦게 돌아오는 등 탈수 신호가 보일 때</li>
          <li>접종을 마치지 않은 어린 강아지, 노령견, 지병이 있는 아이일 때</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>무엇을 기록해야 할까</h2>
        <p className={styles.paragraph}>
          진료실에서 수의사가 묻는 것은 거의 같습니다. 변을 치우기 전에 아래를 남겨두면 진료가
          빨라집니다.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>시작 시점과 횟수</strong> — 언제부터, 하루 몇 번인지
          </li>
          <li>
            <strong>모양</strong> — 형태는 있지만 무른 변인지, 죽 같은지, 물 같은지
          </li>
          <li>
            <strong>색과 섞인 것</strong> — 피, 점액(투명한 젤리 같은 것), 이물
          </li>
          <li>
            <strong>최근 바뀐 것</strong> — 사료 교체, 새 간식, 사람 음식, 산책 중 주워 먹음,
            스트레스(이사·호텔)
          </li>
          <li>
            <strong>함께 보이는 증상</strong> — 식욕, 구토, 음수량, 활동량
          </li>
        </ul>
        <p className={styles.paragraph}>
          가능하면 변 사진을 찍어 두세요. 말로 설명하는 것보다 정확하고, 병원에서 대변 검사를 할지
          판단하는 데 도움이 됩니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>집에서 지켜볼 때</h2>
        <p className={styles.paragraph}>
          기운과 식욕이 평소 같고 한두 번으로 그친 묽은 변이라면, 깨끗한 물을 충분히 주고 간식과 새
          음식은 잠시 멈춘 채 지켜보는 경우가 많습니다. 이때도 횟수와 변 상태는 계속 기록해서,
          나아지는지 나빠지는지를 숫자로 볼 수 있게 하세요.
        </p>
        <p className={styles.note}>
          금식이나 사람용 지사제는 아이의 나이·체중·상태에 따라 위험할 수 있습니다. 집에서 약을
          먹이거나 굶기기 전에 수의사와 상담하세요. 이 글은 기록을 돕기 위한 일반 정보이며 진단을
          대신하지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>반복된다면 기록이 답을 줍니다</h2>
        <p className={styles.paragraph}>
          설사가 몇 주에 한 번씩 되풀이된다면, 그때마다 남긴 기록을 모아 보세요. &quot;사료를 바꾼
          뒤마다&quot;, &quot;특정 간식을 먹은 다음 날&quot;처럼 패턴이 보이는 경우가 많고, 만성
          장질환이나 알레르기를 의심해 검사할 때도 그 기록이 출발점이 됩니다.
        </p>
      </section>
    </GuideArticle>
  );
}
