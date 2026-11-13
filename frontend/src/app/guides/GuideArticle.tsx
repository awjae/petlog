import Link from 'next/link';
import { JsonLd } from '@/shared/components/JsonLd';
import { SITE_NAME, SITE_URL } from '@/shared/config/site';
import { findGuide, otherGuides } from './guides';
import styles from './page.module.css';

function formatKoDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

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
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
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
        <p className={styles.dates}>
          <time dateTime={guide.publishedAt}>{formatKoDate(guide.publishedAt)}</time> 작성
          {guide.updatedAt !== guide.publishedAt && (
            <>
              {' · '}
              <time dateTime={guide.updatedAt}>{formatKoDate(guide.updatedAt)}</time> 수정
            </>
          )}
        </p>
      </header>

      <div className={styles.content}>
        {children}

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            기록은 쌓일수록 쓸모가 생겨요. Petlog에 남기면 변화를 한눈에 보고, 병원에 갈 때 그대로
            보여줄 수 있어요.
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
