'use client';

import { BottomSheet } from '@/shared/components/BottomSheet';
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

/** 이용약관/개인정보처리방침을 바텀시트로 보여준다. */
export function LegalDocumentSheet({ isOpen, doc, onClose }: LegalDocumentSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label={TITLES[doc]} maxHeight="90dvh">
      {({ close }) => (
        <>
          <header className={styles.sheetHeader}>
            <span className={styles.sheetTitle}>{TITLES[doc]}</span>
            <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <div className={styles.body}>
            {doc === 'terms' ? <TermsContent /> : <PrivacyPolicyContent />}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
