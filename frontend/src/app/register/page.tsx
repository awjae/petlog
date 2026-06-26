'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useRegister } from '@/features/auth/hooks/useRegister';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { loading, error, register } = useRegister();

  function isValid() {
    return email.includes('@') && password.length >= 8 && password === confirm;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    const ok = await register(email, password);
    if (ok !== null) router.push('/pets/new');
  }

  return (
    <main className={styles.main} aria-label="회원가입">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>회원가입</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <div className={styles.inner}>
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
              autoComplete="new-password"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm">
              비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              className={`${styles.input} ${confirm && password !== confirm ? styles.inputError : ''}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력해주세요"
              autoComplete="new-password"
              required
            />
            {confirm && password !== confirm && (
              <p className={styles.fieldError}>비밀번호가 일치하지 않아요</p>
            )}
          </div>

          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className={styles.footer}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
