import type { MedicalHubTab } from '../types/medical.types';
import styles from './MedicalHubTabs.module.css';

interface MedicalHubTabsProps {
  active: MedicalHubTab;
  onChange: (tab: MedicalHubTab) => void;
}

const TABS: { id: MedicalHubTab; label: string }[] = [
  { id: 'visits', label: '방문 기록' },
  { id: 'vaccinations', label: '예방접종' },
  { id: 'appointments', label: '예약' },
];

export function MedicalHubTabs({ active, onChange }: MedicalHubTabsProps) {
  return (
    <nav className={styles.tabBar} aria-label="병원 기록 탭">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`${styles.tab} ${active === tab.id ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
