import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'pet-food-transition';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetFoodTransitionGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7~10일에 걸쳐 섞어서 바꿉니다</h2>
        <p className={styles.paragraph}>
          사료를 하루아침에 바꾸면 장내 환경이 따라가지 못해 무른 변·구토·식욕 저하가 오기 쉽습니다.
          강아지와 고양이 모두 기존 사료에 새 사료를 조금씩 늘려 섞는 방식이 기본입니다.
        </p>
        <ul className={styles.list}>
          <li>1~2일차: 기존 75% + 새 사료 25%</li>
          <li>3~4일차: 기존 50% + 새 사료 50%</li>
          <li>5~6일차: 기존 25% + 새 사료 75%</li>
          <li>7일차부터: 새 사료 100%</li>
        </ul>
        <p className={styles.paragraph}>
          장이 예민한 아이, 노령견·노령묘, 입맛이 까다로운 고양이는 각 단계를 2~3일씩 늘려 10~14일에
          걸쳐 바꿔도 됩니다. 무른 변이 보이면 한 단계 전 비율로 돌아가 며칠 더 머무르세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>급여량은 새 사료 기준으로 다시 계산합니다</h2>
        <p className={styles.paragraph}>
          사료마다 열량(kcal/kg)이 달라서 같은 컵으로 주면 실제 칼로리가 크게 달라질 수 있습니다.
          포장지의 급여 가이드나 열량 표기를 보고 새 사료 기준 양을 다시 잡으세요. 바꾼 뒤 2~4주는
          주 1회 체중을 재서, 의도하지 않게 늘거나 줄지 않는지 확인합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>바꾸는 동안 기록할 것</h2>
        <ul className={styles.list}>
          <li>
            <strong>변 상태와 횟수</strong> — 비율을 올린 다음 날 무른 변이 생기는지
          </li>
          <li>
            <strong>먹는 양</strong> — 남기는지, 새 사료만 골라내는지
          </li>
          <li>
            <strong>구토·가려움</strong> — 새 사료 성분이 맞지 않는 신호일 수 있습니다
          </li>
          <li>
            <strong>체중</strong> — 바꾸기 전과 바꾼 뒤 2~4주
          </li>
        </ul>
        <p className={styles.paragraph}>
          단계별로 날짜를 남겨두면 &quot;50%로 올린 다음 날부터 변이 물러졌다&quot;처럼 원인을 짚을
          수 있고, 나중에 사료를 또 바꿀 때 이 아이에게 맞는 속도를 알 수 있습니다.
        </p>
        <p className={styles.note}>
          처방식으로 바꾸는 경우, 설사·구토가 이틀 넘게 이어지는 경우, 먹지 않는 날이 생기는
          경우(특히 고양이)에는 바꾸는 일정을 멈추고 수의사와 상담하세요.
        </p>
      </section>
    </GuideArticle>
  );
}
