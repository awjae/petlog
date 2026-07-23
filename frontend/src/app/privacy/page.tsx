import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PrivacyPolicyContent,
  PRIVACY_POLICY_EFFECTIVE_DATE,
} from '@/features/legal/components/PrivacyPolicyContent';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    'Petlog 개인정보처리방침. 회원·반려동물·건강 기록 정보의 수집, 이용, 보관, 파기 절차를 안내합니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.main} aria-label="개인정보처리방침">
      <header className={styles.header}>
        <h1 className={styles.title}>개인정보처리방침</h1>
        <p className={styles.effectiveDate}>시행일 {PRIVACY_POLICY_EFFECTIVE_DATE}</p>
      </header>

      <div className={styles.content}>
        <PrivacyPolicyContent />
      </div>

      <p className={styles.footer}>
        <Link href="/settings" className={styles.footerLink}>
          설정으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
