// filepath: src/features/shared/components/FAB.tsx

import Link from 'next/link';
import styles from './FAB.module.css';

type FABProps = {
  href: string;
  label: string;
};

export function FAB({ href, label }: FABProps) {
  return (
    <Link href={href} className={styles.fab} aria-label={label}>
      <span aria-hidden="true">+</span>
    </Link>
  );
}
