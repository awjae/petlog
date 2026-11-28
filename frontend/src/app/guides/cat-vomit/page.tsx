import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'cat-vomit';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function CatVomitGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>바로 병원에 가야 하는 경우</h2>
        <p className={styles.paragraph}>
          고양이는 강아지보다 자주 토하는 편이지만, 아래에 해당하면 기록보다 진료가 먼저입니다.
        </p>
        <ul className={styles.list}>
          <li>하루에 여러 번 토하거나, 물만 마셔도 토할 때</li>
          <li>토사물에 피가 섞이거나 커피 찌꺼기처럼 검은 것이 보일 때</li>
          <li>
            하루 이상 전혀 먹지 않을 때 — 고양이는 굶는 기간이 길어지면 간에 무리가 갈 수 있습니다
          </li>
          <li>실·끈·리본·고무줄을 삼켰을 가능성이 있을 때 (입 밖으로 보여도 당기지 마세요)</li>
          <li>숨어서 나오지 않고 축 처지거나, 배를 만지면 아파할 때</li>
          <li>새끼 고양이, 노령묘, 신장병·당뇨 등 지병이 있는 아이일 때</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>헤어볼, 구토, 역류 구분하기</h2>
        <ul className={styles.list}>
          <li>
            <strong>헤어볼</strong> — 길쭉한 털 뭉치가 나옵니다. 그루밍하는 고양이에게 흔하지만, 주
            1회 이상으로 잦다면 상담해볼 신호입니다.
          </li>
          <li>
            <strong>구토</strong> — 배가 꿀렁이며 힘을 준 뒤 소화된 음식이나 노란 액체가 나옵니다.
          </li>
          <li>
            <strong>역류</strong> — 힘을 주지 않고 먹은 직후 거의 그대로 나옵니다. 급하게 먹는
            습관이나 식도 문제일 수 있어 구토와 구분해 말해주는 것이 좋습니다.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>무엇을 기록해야 할까</h2>
        <ul className={styles.list}>
          <li>
            <strong>언제</strong> — 먹은 직후인지, 공복인지(새벽·아침)
          </li>
          <li>
            <strong>얼마나 자주</strong> — 이번이 처음인지, 이번 주 몇 번째인지
          </li>
          <li>
            <strong>무엇이</strong> — 털, 사료 알갱이, 노란 액체, 거품, 이물
          </li>
          <li>
            <strong>최근 바뀐 것</strong> — 사료·간식 교체, 화분·실내 식물, 새 장난감
          </li>
          <li>
            <strong>그 뒤 상태</strong> — 바로 다시 먹는지, 음수량과 화장실 횟수는 평소 같은지
          </li>
        </ul>
        <p className={styles.paragraph}>
          토사물은 치우기 전에 사진으로 남겨두세요. 진료 때 말로 설명하는 것보다 훨씬 정확합니다.
        </p>
        <p className={styles.note}>
          이 글은 기록을 돕기 위한 일반 정보이며 진단을 대신하지 않습니다. 사람용 약은 고양이에게
          위험할 수 있으니, 집에서 약을 먹이기 전에 수의사와 상담하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>&quot;원래 잘 토하는 아이&quot;일수록 기록하세요</h2>
        <p className={styles.paragraph}>
          자주 토하는 고양이는 보호자도 익숙해져서 횟수가 늘어난 걸 놓치기 쉽습니다. 한 달에 한두
          번이던 구토가 주 2~3회로 늘었다면, 그 변화 자체가 수의사에게 중요한 정보입니다.
          날짜만이라도 꾸준히 남겨두면 &quot;요즘 좀 잦아진 것 같다&quot;를 숫자로 보여줄 수
          있습니다.
        </p>
      </section>
    </GuideArticle>
  );
}
