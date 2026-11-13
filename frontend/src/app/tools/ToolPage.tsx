import Link from 'next/link';
import { JsonLd } from '@/shared/components/JsonLd';
import { SITE_URL } from '@/shared/config/site';
import { findTool } from './tools';
import styles from '../guides/page.module.css';

interface ToolPageProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * 계산 도구 페이지의 공통 껍데기 — 제목, 구조화 데이터, 가입 CTA.
 * 가이드와 같은 공개 콘텐츠라 스타일은 가이드 것을 그대로 쓴다.
 */
export function ToolPage({ slug, children }: ToolPageProps) {
  const tool = findTool(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    description: tool.description,
    url: `${SITE_URL}/tools/${slug}`,
    applicationCategory: 'HealthApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  };

  return (
    <main className={styles.main} aria-label={tool.title}>
      <JsonLd data={jsonLd} />

      <header className={styles.header}>
        <h1 className={styles.title}>{tool.title}</h1>
        <p className={styles.lead}>{tool.description}</p>
      </header>

      <div className={styles.content}>
        {children}

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            계산은 한 번이지만 건강은 흐름이에요. Petlog에 기록하면 변화를 한눈에 보고, 병원에 갈 때
            그대로 보여줄 수 있어요.
          </p>
          <Link href="/register" className={styles.ctaBtn}>
            무료로 기록 시작하기
          </Link>
        </div>

        <nav className={styles.related} aria-label="다른 도구와 가이드">
          <ul className={styles.relatedList}>
            <li>
              <Link href="/tools" className={styles.relatedLink}>
                다른 계산 도구 보기
              </Link>
            </li>
            <li>
              <Link href="/guides" className={styles.relatedLink}>
                건강 기록 가이드 보기
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
