import Link from 'next/link';
import { JsonLd } from '@/shared/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/shared/config/site';
import { findGuide, otherGuides } from './guides';
import styles from './page.module.css';

interface GuideArticleProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * 가이드 글의 공통 껍데기 — 제목, 구조화 데이터, 다른 글 링크, 가입 CTA.
 * 본문만 각 라우트가 children으로 넘긴다.
 */
export function GuideArticle({ slug, children }: GuideArticleProps) {
  const guide = findGuide(slug);
  const url = `${SITE_URL}/guides/${slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    mainEntityOfPage: url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <main className={styles.main} aria-label={guide.title}>
      <JsonLd data={articleJsonLd} />

      <header className={styles.header}>
        <h1 className={styles.title}>{guide.title}</h1>
        <p className={styles.lead}>{guide.description}</p>
      </header>

      <div className={styles.content}>
        {children}

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            재는 것보다 어려운 건 꾸준히 남기는 거예요. Petlog에 기록하면 변화를 그래프로 보고,
            병원에 갈 때 그대로 보여줄 수 있어요.
          </p>
          <Link href="/register" className={styles.ctaBtn}>
            무료로 기록 시작하기
          </Link>
        </div>

        <nav className={styles.related} aria-label="다른 가이드">
          <p className={styles.relatedTitle}>다른 가이드</p>
          <ul className={styles.relatedList}>
            {otherGuides(slug).map((other) => (
              <li key={other.slug}>
                <Link href={`/guides/${other.slug}`} className={styles.relatedLink}>
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
