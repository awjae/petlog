import Link from 'next/link';
import styles from './StatusPage.module.css';

type Action = { label: string; href: string } | { label: string; onClick: () => void };

type StatusPageProps = {
  code?: string;
  title: string;
  description: string;
  action: Action;
};

export function StatusPage({ code, title, description, action }: StatusPageProps) {
  return (
    <main className={styles.main} aria-label={title}>
      <StatusIllustration />
      {code && <p className={styles.code}>{code}</p>}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {'href' in action ? (
        <Link href={action.href} className={styles.actionBtn}>
          {action.label}
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} className={styles.actionBtn}>
          {action.label}
        </button>
      )}
    </main>
  );
}

function StatusIllustration() {
  return (
    <svg width={96} height={96} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="46" fill="var(--color-primary-light)" />
      <circle cx="48" cy="48" r="46" stroke="var(--color-border)" strokeWidth="1" />
      {/* 발바닥 */}
      <ellipse cx="48" cy="58" rx="17" ry="14" fill="var(--color-primary)" />
      <circle cx="31" cy="38" r="7" fill="var(--color-primary)" />
      <circle cx="48" cy="30" r="7.5" fill="var(--color-primary)" />
      <circle cx="65" cy="38" r="7" fill="var(--color-primary)" />
      {/* 물음표 */}
      <text
        x="48"
        y="64"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--color-primary-light)"
      >
        ?
      </text>
    </svg>
  );
}
