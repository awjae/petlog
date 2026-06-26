'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/features/auth/hooks/useLogin';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function isValid() {
    return email.includes('@') && password.length >= 8;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    const ok = await login(email, password);
    if (ok !== null) router.push('/home');
  }

  return (
    <main className={styles.main} aria-label="로그인">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            🐾
          </span>
          <h1 className={styles.brandName}>Petlog</h1>
          <p className={styles.brandDesc}>반려동물 건강 기록 서비스</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@petlog.kr"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.footer}>
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className={styles.footerLink}>
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
