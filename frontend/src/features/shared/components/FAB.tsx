import Link from 'next/link';
import { Plus } from 'lucide-react';
import styles from './FAB.module.css';

type FABProps = {
  href: string;
  label: string;
};

export function FAB({ href, label }: FABProps) {
  return (
    <Link href={href} className={styles.fab} aria-label={label}>
      <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
}
