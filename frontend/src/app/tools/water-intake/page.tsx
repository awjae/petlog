import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolPage } from '../ToolPage';
import { findTool } from '../tools';
import { WaterIntakeCalculator } from './WaterIntakeCalculator';
import styles from '../../guides/page.module.css';

const SLUG = 'water-intake';
const tool = findTool(SLUG);

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
};

export default function WaterIntakeToolPage() {
  return (
    <ToolPage slug={SLUG}>
      <WaterIntakeCalculator />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>하루 값보다 며칠의 흐름</h2>
        <p className={styles.paragraph}>
          덥거나 많이 뛰어논 날은 당연히 더 마십니다. 하루 값 하나로 판단하지 말고 같은 방식으로
          며칠 재서 평소 수준을 먼저 알아두세요. 기준을 넘는 날이 이어지는지가 중요합니다.
        </p>
        <p className={styles.paragraph}>
          집에서 재는 방법은 <Link href="/guides/pet-water-intake">음수량 가이드</Link>에
          정리해두었습니다.
        </p>
        <p className={styles.note}>
          이 계산은 기록을 위한 참고 기준이며 진단이 아닙니다. 개 100mL, 고양이 50mL(체중 1kg당
          하루)를 넘게 마시는 날이 이어지거나, 하루 종일 물을 거의 마시지 않으면 수의사와
          상담하세요.
        </p>
      </section>
    </ToolPage>
  );
}
