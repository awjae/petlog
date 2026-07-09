'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApolloClient } from '@apollo/client/react';
import { PawPrint, Check, Bell, Pill, KeyRound, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { BottomNav } from '@/features/shared/components/BottomNav';
import { EditProfileModal } from '@/features/settings/components/EditProfileModal';
import { WithdrawInfoSheet } from '@/features/settings/components/WithdrawInfoSheet';
import { useCurrentUser } from '@/features/settings/hooks/useCurrentUser';
import { removeLastSelectedPetId } from '@/features/shared/utils/lastSelectedPet';
import { version } from '../../../package.json';
import styles from './page.module.css';

const THEMES = [
  { value: 'pastel-sky' as const, label: '파스텔 스카이', preview: '#6baed6' },
  { value: 'pastel-pink' as const, label: '파스텔 핑크', preview: '#d4728a' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const client = useApolloClient();
  const { theme, setTheme } = useTheme();
  const { name, email, loading } = useCurrentUser();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    removeLastSelectedPetId();
    await client.clearStore();
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
              <p className={styles.profileName}>
                {loading ? '불러오는 중...' : (name ?? '보호자')}
              </p>
              <p className={styles.profileEmail}>{loading ? '' : email}</p>
            </div>
            <button
              className={styles.editBtn}
              aria-label="프로필 편집"
              onClick={() => setIsEditOpen(true)}
              disabled={loading}
            >
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
            <Link href="/privacy" className={styles.listItem}>
              <Shield size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabel}>개인정보처리방침</span>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={styles.chevron}
                aria-hidden="true"
              />
            </Link>
            <div className={styles.divider} />
            <button className={styles.listItemDanger} onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.75} className={styles.listIcon} aria-hidden="true" />
              <span className={styles.listLabelDanger}>로그아웃</span>
            </button>
          </div>
        </section>

        {/* ── 회원 탈퇴 (오탭 방지를 위해 카드 바깥에 저강도로 배치) ── */}
        <button
          type="button"
          className={styles.withdrawBtn}
          onClick={() => setIsWithdrawSheetOpen(true)}
        >
          회원 탈퇴
        </button>

        <p className={styles.contact}>문의: aw.js.share@gmail.com</p>
        <p className={styles.version}>Petlog v{version}</p>
      </div>

      <BottomNav />

      <EditProfileModal
        isOpen={isEditOpen}
        currentName={name}
        onClose={() => setIsEditOpen(false)}
      />

      <WithdrawInfoSheet
        isOpen={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        onProceed={() => {
          setIsWithdrawSheetOpen(false);
          router.push('/settings/withdraw');
        }}
      />
    </main>
  );
}
