// filepath: src/features/shared/components/BottomNav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: '🏠', label: '홈' },
  { href: '/records', icon: '📋', label: '기록' },
  { href: '/reports', icon: '📊', label: '리포트' },
  { href: '/settings', icon: '⚙️', label: '설정' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="메인 내비게이션">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={styles.link}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
