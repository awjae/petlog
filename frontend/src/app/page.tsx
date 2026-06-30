import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className={styles.landing} aria-label="Petlog 소개">
      <span className={styles.landingIcon} aria-hidden="true">
        🐾
      </span>
      <h1 className={styles.landingTitle}>반려동물 건강 기록</h1>
      <p className={styles.landingDesc}>
        체중, 식사, 활동량을 간편하게 기록하고
        <br />
        AI 리포트로 건강 변화를 파악해보세요.
      </p>
      <Link href="/register" className={styles.landingCta}>
        무료로 시작하기
      </Link>
      <Link href="/login" className={styles.landingLogin}>
        이미 계정이 있어요 <span>로그인</span>
      </Link>
    </main>
  );
}
