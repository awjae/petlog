'use client';

import { useRouter } from 'next/navigation';
import { PawPrint, Check, Bell, Pill, KeyRound, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { BottomNav } from '@/features/shared/components/BottomNav';
import styles from './page.module.css';

const THEMES = [
  { value: 'pastel-sky' as const, label: '파스텔 스카이', preview: '#6baed6' },
  { value: 'pastel-pink' as const, label: '파스텔 핑크', preview: '#d4728a' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  function handleLogout() {
    router.push('/login');
  }

  return (
    <main className={styles.main} aria-label="설정">
      <header className={styles.header}>
        <h1 className={styles.title}>설정</h1>
      </header>

      <div className={styles.content}>
        {/* ── 프로필 ── */}
        <section className={styles.section}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar} aria-hidden="true">
              <PawPrint size={24} strokeWidth={1.5} />
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>보호자</p>
              <p className={styles.profileEmail}>djwotmd@gmail.com</p>
            </div>
            <button className={styles.editBtn} aria-label="프로필 편집">
              편집
            </button>
          </div>
        </section>

        {/* ── 앱 테마 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>앱 테마</h2>
          <div className={styles.themeGrid} role="group" aria-label="테마 선택">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.themeBtn} ${theme === t.value ? styles.themeBtnActive : ''}`}
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
              >
                <span
                  className={styles.themeColor}
                  style={{ background: t.preview }}
                  aria-hidden="true"
                />
                <span className={styles.themeLabel}>{t.label}</span>
                {theme === t.value && (
                  <span className={styles.themeCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── 알림 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>알림</h2>
          <div className={styles.listCard}>
            <button className={styles.listItem} disabled>
              <Bell size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabel}>건강 기록 알림</span>
              <span className={styles.badge}>준비 중</span>
            </button>
            <div className={styles.divider} />
            <button className={styles.listItem} disabled>
              <Pill size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabel}>투약·접종 알림</span>
              <span className={styles.badge}>준비 중</span>
            </button>
          </div>
        </section>

        {/* ── 계정 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>계정</h2>
          <div className={styles.listCard}>
            <button className={styles.listItem} disabled>
              <KeyRound
                size={18}
                strokeWidth={1.75}
                className={styles.listIcon}
                aria-hidden="true"
              />
              <span className={styles.listLabel}>비밀번호 변경</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={styles.chevron}
                aria-hidden="true"
              />
            </button>
            <div className={styles.divider} />
            <button className={styles.listItemDanger} onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabelDanger}>로그아웃</span>
            </button>
          </div>
        </section>

        <p className={styles.version}>Petlog v0.1.0-beta</p>
      </div>

      <BottomNav />
    </main>
  );
}
