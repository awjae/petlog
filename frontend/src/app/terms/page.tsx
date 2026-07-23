import type { Metadata } from 'next';
import Link from 'next/link';
import { TermsContent, TERMS_EFFECTIVE_DATE } from '@/features/legal/components/TermsContent';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '이용약관',
  description:
    'Petlog 이용약관. 서비스 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 안내합니다.',
};

export default function TermsPage() {
  return (
    <main className={styles.main} aria-label="이용약관">
      <header className={styles.header}>
        <h1 className={styles.title}>이용약관</h1>
        <p className={styles.effectiveDate}>시행일 {TERMS_EFFECTIVE_DATE}</p>
      </header>

      <div className={styles.content}>
        <TermsContent />
      </div>

      <p className={styles.footer}>
        <Link href="/settings" className={styles.footerLink}>
          설정으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
