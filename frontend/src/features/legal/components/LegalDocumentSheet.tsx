'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsContent } from './TermsContent';
import styles from './LegalDocumentSheet.module.css';

export type LegalDocumentType = 'terms' | 'privacy';

interface LegalDocumentSheetProps {
  isOpen: boolean;
  doc: LegalDocumentType;
  onClose: () => void;
}

const TITLES: Record<LegalDocumentType, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
};

/**
 * 이용약관/개인정보처리방침을 바텀시트로 보여준다.
 * WithdrawInfoSheet(frontend/src/features/settings/components/WithdrawInfoSheet.tsx)의
 * mount→rAF×2→visible 트리거, 300ms cubic-bezier 애니메이션 패턴을 그대로 재사용한다.
 */
export function LegalDocumentSheet({ isOpen, doc, onClose }: LegalDocumentSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const rAF1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(rAF1);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 310);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 310);
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={TITLES[doc]}
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        <header className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>{TITLES[doc]}</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {doc === 'terms' ? <TermsContent /> : <PrivacyPolicyContent />}
        </div>
      </div>
    </div>
  );
}
