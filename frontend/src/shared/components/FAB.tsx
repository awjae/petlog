import Link from 'next/link';
import { Plus } from 'lucide-react';
import styles from './FAB.module.css';

type FABProps =
  | { href: string; onClick?: never; label: string }
  | { onClick: () => void; href?: never; label: string };

export function FAB({ label, ...rest }: FABProps) {
  if ('onClick' in rest && rest.onClick) {
    return (
      <button type="button" className={styles.fab} aria-label={label} onClick={rest.onClick}>
        <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
      </button>
    );
  }
  return (
    <Link href={(rest as { href: string }).href} className={styles.fab} aria-label={label}>
      <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
}
