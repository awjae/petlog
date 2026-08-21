'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Settings, type LucideIcon, HeartPulse } from 'lucide-react';
import styles from './BottomNav.module.css';

type NavItem = {
  href: string;
  Icon: LucideIcon;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/home', Icon: Home, label: '홈' },
  { href: '/records', Icon: CalendarDays, label: '기록' },
  { href: '/reports', Icon: HeartPulse, label: '리포트' },
  { href: '/settings', Icon: Settings, label: '설정' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="메인 내비게이션">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={styles.link}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <item.Icon size={20} strokeWidth={isActive ? 2 : 1.75} className={styles.icon} />
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
