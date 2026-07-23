'use client';

import { useState } from 'react';
import { Checkbox } from '@/shared/components/Checkbox';
import {
  LegalDocumentSheet,
  type LegalDocumentType,
} from '@/features/legal/components/LegalDocumentSheet';
import type { RegisterConsents } from '../types/auth.types';
import styles from './AgreementSection.module.css';

interface AgreementSectionProps {
  values: RegisterConsents;
  onChange: (values: RegisterConsents) => void;
}

function guidanceText(values: RegisterConsents): string | null {
  const missingTerms = !values.termsOfService;
  const missingPrivacy = !values.privacyPolicy;
  if (missingTerms && missingPrivacy) return '이용약관과 개인정보 수집·이용 동의가 필요해요';
  if (missingTerms) return '이용약관 동의가 필요해요';
  if (missingPrivacy) return '개인정보 수집·이용 동의가 필요해요';
  return null;
}

export function AgreementSection({ values, onChange }: AgreementSectionProps) {
  const [openDoc, setOpenDoc] = useState<LegalDocumentType | null>(null);

  const allChecked = values.termsOfService && values.privacyPolicy && values.marketingNotification;
  const guidance = guidanceText(values);

  function toggleAll() {
    const next = !allChecked;
    onChange({ termsOfService: next, privacyPolicy: next, marketingNotification: next });
  }

  function toggleOne(key: keyof RegisterConsents, checked: boolean) {
    onChange({ ...values, [key]: checked });
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <label className={styles.allRow} htmlFor="agree-all">
          <Checkbox id="agree-all" checked={allChecked} onChange={toggleAll} />
          <span className={styles.allLabel}>전체 동의</span>
        </label>

        <div className={styles.divider} />

        <div className={styles.items}>
          <div className={styles.item}>
            <label className={styles.itemMain} htmlFor="agree-terms">
              <Checkbox
                id="agree-terms"
                checked={values.termsOfService}
                onChange={(checked) => toggleOne('termsOfService', checked)}
                ariaRequired
              />
              <span className={styles.itemLabel}>
                <span className={styles.badgeRequired}>[필수]</span> 이용약관 동의
              </span>
            </label>
            <button type="button" className={styles.viewBtn} onClick={() => setOpenDoc('terms')}>
              보기
            </button>
          </div>

          <div className={styles.item}>
            <label className={styles.itemMain} htmlFor="agree-privacy">
              <Checkbox
                id="agree-privacy"
                checked={values.privacyPolicy}
                onChange={(checked) => toggleOne('privacyPolicy', checked)}
                ariaRequired
              />
              <span className={styles.itemLabel}>
                <span className={styles.badgeRequired}>[필수]</span> 개인정보 수집·이용 동의
              </span>
            </label>
            <button type="button" className={styles.viewBtn} onClick={() => setOpenDoc('privacy')}>
              보기
            </button>
          </div>

          <div className={styles.item}>
            <label className={styles.itemMain} htmlFor="agree-marketing">
              <Checkbox
                id="agree-marketing"
                checked={values.marketingNotification}
                onChange={(checked) => toggleOne('marketingNotification', checked)}
              />
              <span className={styles.itemLabelGroup}>
                <span className={styles.itemLabel}>
                  <span className={styles.badgeOptional}>[선택]</span> 마케팅 정보 수신 동의
                </span>
                <span className={styles.caption}>소식과 이벤트 정보를 보내드려요</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {guidance && <p className={styles.guidance}>{guidance}</p>}

      <LegalDocumentSheet
        isOpen={openDoc !== null}
        doc={openDoc ?? 'terms'}
        onClose={() => setOpenDoc(null)}
      />
    </div>
  );
}
