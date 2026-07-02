import Link from 'next/link';
import { History, Stethoscope, Pill, Sparkles, type LucideIcon } from 'lucide-react';
import styles from './PetQuickLinks.module.css';

interface PetQuickLinksProps {
  petId: string;
}

export function PetQuickLinks({ petId }: PetQuickLinksProps) {
  const links: { href: string; Icon: LucideIcon; label: string }[] = [
    { href: `/pets/${petId}/timeline`, Icon: History, label: '타임라인' },
    { href: `/pets/${petId}/medical`, Icon: Stethoscope, label: '병원기록' },
    { href: `/pets/${petId}/medications`, Icon: Pill, label: '투약관리' },
    { href: '/reports', Icon: Sparkles, label: 'AI 리포트' },
  ];

  return (
    <nav className={styles.grid} aria-label="반려동물 하위 메뉴">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={styles.card}>
          <link.Icon size={22} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
