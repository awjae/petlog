import type { Metadata } from 'next';
import { GuideArticle } from '../GuideArticle';
import { findGuide } from '../guides';
import styles from '../page.module.css';

const SLUG = 'dog-vaccination-schedule';
const guide = findGuide(SLUG);

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
};

export default function DogVaccinationScheduleGuide() {
  return (
    <GuideArticle slug={SLUG}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기초 접종: 생후 6~8주부터 여러 번</h2>
        <p className={styles.paragraph}>
          어미에게 받은 항체는 생후 몇 주 동안 아기 강아지를 지켜주지만, 그 항체가 남아 있는
          동안에는 백신이 잘 듣지 않습니다. 언제 사라지는지는 아이마다 달라서, 기초 접종은 한 번이
          아니라 <strong>2~4주 간격으로 여러 번</strong> 맞힙니다. 보통 생후 6~8주에 시작해 생후
          16주 무렵까지 이어집니다.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>종합백신(DHPPL)</strong>: 홍역·간염·파보·파라인플루엔자·렙토스피라. 기초 접종의
            중심입니다.
          </li>
          <li>
            <strong>코로나 장염, 켄넬코프(기관지염)</strong>: 생활 환경에 따라 기초 접종 기간에 함께
            맞히는 경우가 많습니다.
          </li>
          <li>
            <strong>광견병</strong>: 보통 생후 3개월 이후에 맞힙니다.
          </li>
        </ul>
        <p className={styles.paragraph}>
          어떤 백신을 몇 차까지 맞힐지는 병원과 아이의 건강 상태에 따라 달라집니다. 첫 진료 때 받은
          접종 계획표를 기준으로 삼으세요.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기초 접종 후: 해마다 추가 접종</h2>
        <p className={styles.paragraph}>
          기초 접종을 마친 뒤에는 면역을 유지하기 위해 보통 1년 간격으로 추가 접종을 합니다. 백신
          종류에 따라 간격이 다를 수 있고, 항체가 검사로 추가 접종 시기를 정하는 병원도 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>접종 기록에 남길 것</h2>
        <p className={styles.paragraph}>
          접종은 몇 년에 걸쳐 이어지고, 병원을 옮기거나 미용·호텔·유치원에 맡길 때 접종 이력을 묻는
          경우가 많습니다. 수첩을 잃어버리면 다시 확인하기 어렵습니다.
        </p>
        <ul className={styles.list}>
          <li>접종일과 백신 이름 (몇 차인지)</li>
          <li>
            <strong>다음 접종 예정일</strong> — 예정일을 남겨두면 그날 아침 알림을 받을 수 있습니다
          </li>
          <li>접종 후 이상 반응 (붓기, 구토, 기운 없음 등)</li>
        </ul>
        <p className={styles.note}>
          이 글은 기록을 남기기 위한 일반적인 참고 정보이며 진료가 아닙니다. 접종 일정과 백신 종류는
          담당 수의사의 안내를 따르세요. 접종 후 얼굴이 붓거나, 숨쉬기 힘들어하거나, 축 처지면 바로
          병원에 연락하세요.
        </p>
      </section>
    </GuideArticle>
  );
}
