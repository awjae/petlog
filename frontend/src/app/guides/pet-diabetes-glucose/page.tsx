import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'pet-diabetes-glucose';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function PetDiabetesGlucoseGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>왜 집에서 혈당을 기록할까</h2>
        <p className={styles.paragraph}>
          당뇨 진단을 받은 개·고양이는 인슐린 용량을 맞추는 과정이 오래 걸립니다. 병원에서 한 번 잰
          혈당은 긴장 때문에 평소보다 높게 나오기도 해서, 수의사는 집에서 잰 값의 흐름을 함께 보고
          싶어 합니다. 보호자가 남긴 기록이 곧 용량 조절의 근거가 됩니다.
        </p>
        <p className={styles.paragraph}>
          당뇨를 관리 중인 아이는 건강한 아이와 기준이 다릅니다. 200mg/dL 전후가 일상인 경우도
          있으므로, 숫자 하나를 일반 기준과 비교하기보다 수의사가 정해준 목표 범위와 비교하세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>함께 남겨야 하는 것</h2>
        <p className={styles.paragraph}>
          혈당 숫자만 있으면 해석할 수 없습니다. 같은 200이라도 인슐린 직전인지 직후인지에 따라
          의미가 완전히 다릅니다.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>측정 시각</strong>과 그때가 <strong>식사·인슐린 투여 후 몇 시간</strong>인지
          </li>
          <li>그날 먹은 양 (평소보다 적게 먹었는지)</li>
          <li>인슐린 투여 시각과 용량 (수의사 지시대로 투여한 기록)</li>
          <li>물 마시는 양과 소변량의 변화</li>
          <li>체중 (주 1회 정도)</li>
        </ul>
        <p className={styles.paragraph}>
          수의사가 &quot;혈당 곡선&quot;을 요청하면 정해진 간격으로 하루 동안 여러 번 재게 됩니다.
          간격과 횟수는 반드시 수의사 안내를 따르세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>저혈당은 바로 대응해야 한다</h2>
        <p className={styles.paragraph}>
          인슐린을 맞는 아이에게 가장 위험한 것은 높은 혈당보다 <strong>낮은 혈당</strong>입니다.
          떨림, 비틀거림, 멍하게 있음, 경련 같은 모습이 보이면 기록을 미루고 바로 병원에 연락하세요.
        </p>
        <ul className={styles.list}>
          <li>
            밥을 거의 안 먹은 날 평소 용량의 인슐린을 그대로 놓지 않도록, 투여 전에 꼭 확인합니다.
          </li>
          <li>인슐린 용량은 혈당 수치를 보고 보호자가 임의로 바꾸지 않습니다.</li>
        </ul>
        <p className={styles.note}>
          이 글은 기록을 남기기 위한 참고 정보이며 진단이나 처방이 아닙니다. 목표 혈당 범위와 인슐린
          용량, 측정 방법은 담당 수의사의 안내를 따르세요.
        </p>
      </section>
    </GuideArticle>
  );
}
