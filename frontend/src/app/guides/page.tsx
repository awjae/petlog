import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from './guides';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '반려동물 건강 기록 가이드',
  description:
    '체중, 체온 등 집에서 남길 수 있는 반려동물 건강 기록을 어떻게 재고 언제 상담해야 하는지 정리한 가이드 모음입니다.',
};

export default function GuidesIndexPage() {
  return (
    <main className={styles.main} aria-label="반려동물 건강 기록 가이드">
      <header className={styles.header}>
        <h1 className={styles.title}>반려동물 건강 기록 가이드</h1>
        <p className={styles.lead}>
          집에서 남길 수 있는 기록을 어떻게 재고, 어떤 변화부터 수의사와 상담해야 하는지 정리했어요.
        </p>
      </header>

      <div className={styles.content}>
        <ul className={styles.indexList}>
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/guides/${guide.slug}`} className={styles.indexItem}>
                <span className={styles.indexItemTitle}>{guide.title}</span>
                <span className={styles.indexItemDesc}>{guide.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
