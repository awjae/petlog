import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS } from './tools';
import styles from '../guides/page.module.css';

export const metadata: Metadata = {
  title: '반려동물 계산 도구',
  description:
    '강아지·고양이 나이 환산 등 보호자에게 필요한 계산을 바로 해볼 수 있는 무료 도구 모음입니다.',
};

export default function ToolsIndexPage() {
  return (
    <main className={styles.main} aria-label="반려동물 계산 도구">
      <header className={styles.header}>
        <h1 className={styles.title}>반려동물 계산 도구</h1>
        <p className={styles.lead}>가입 없이 바로 써볼 수 있는 계산 도구예요.</p>
      </header>

      <div className={styles.content}>
        <ul className={styles.indexList}>
          {TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/tools/${tool.slug}`} className={styles.indexItem}>
                <span className={styles.indexItemTitle}>{tool.title}</span>
                <span className={styles.indexItemDesc}>{tool.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
