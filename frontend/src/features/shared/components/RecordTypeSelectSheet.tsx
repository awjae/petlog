'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft } from 'lucide-react';
import {
  RECORD_ILLUSTRATIONS,
  type IllustrationKey,
} from '@/shared/components/RecordTypeIllustrations';
import styles from './RecordTypeSelectSheet.module.css';

interface SheetPet {
  id: string;
  name: string;
}

interface RecordTypeSelectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pets: SheetPet[];
}

interface SheetItem {
  label: string;
  illustration: IllustrationKey;
  href: (petId: string) => string;
}

const DAILY_ITEMS: SheetItem[] = [
  { label: '체중', illustration: 'weight', href: (id) => `/records/new?type=weight&petId=${id}` },
  {
    label: '식사',
    illustration: 'appetite',
    href: (id) => `/records/new?type=appetite&petId=${id}`,
  },
  {
    label: '산책',
    illustration: 'activity',
    href: (id) => `/records/new?type=activity&petId=${id}`,
  },
  { label: '메모', illustration: 'mood', href: (id) => `/records/new?type=mood&petId=${id}` },
  { label: '증상', illustration: 'symptom', href: (id) => `/records/new?type=symptom&petId=${id}` },
  { label: '배변', illustration: 'stool', href: (id) => `/records/new?type=stool&petId=${id}` },
  { label: '구토', illustration: 'vomit', href: (id) => `/records/new?type=vomit&petId=${id}` },
];

const MEDICAL_ITEMS: SheetItem[] = [
  { label: '병원 방문', illustration: 'hospital', href: (id) => `/pets/${id}/medical/new` },
  {
    label: '예방접종',
    illustration: 'vaccination',
    href: (id) => `/pets/${id}/medical/vaccinations/new`,
  },
  {
    label: '병원 예약',
    illustration: 'appointment',
    href: (id) => `/pets/${id}/medical/appointments/new`,
  },
  { label: '투약', illustration: 'medication', href: (id) => `/pets/${id}/medications/new` },
];

type Step = 'type' | 'pet';

export function RecordTypeSelectSheet({ isOpen, onClose, pets }: RecordTypeSelectSheetProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('type');
  const [pendingItem, setPendingItem] = useState<SheetItem | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setStep('type');
      setPendingItem(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
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

  function handleSelectType(item: SheetItem) {
    if (pets.length === 0) {
      handleClose();
      setTimeout(() => router.push('/pets/new'), 310);
      return;
    }

    if (pets.length === 1) {
      handleClose();
      setTimeout(() => router.push(item.href(pets[0].id)), 310);
      return;
    }

    setPendingItem(item);
    setStep('pet');
  }

  function handleSelectPet(petId: string) {
    if (!pendingItem) return;
    handleClose();
    setTimeout(() => router.push(pendingItem.href(petId)), 310);
  }

  function handleBackToType() {
    setStep('type');
    setPendingItem(null);
  }

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`}>
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="기록 유형 선택"
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
      >
        <div className={styles.dragHandleArea}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        <header className={styles.header}>
          {step === 'pet' && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBackToType}
              aria-label="뒤로"
            >
              <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          <span className={styles.title}>
            {step === 'type' ? '무엇을 기록할까요?' : '어떤 반려동물인가요?'}
          </span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        {step === 'type' && (
          <div className={styles.body}>
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>일상 / 건강 기록</h2>
              <div className={styles.grid}>
                {DAILY_ITEMS.map((item) => {
                  const Illust = RECORD_ILLUSTRATIONS[item.illustration];
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={styles.gridBtn}
                      onClick={() => handleSelectType(item)}
                    >
                      <span className={styles.gridIcon} aria-hidden="true">
                        <Illust size={34} />
                      </span>
                      <span className={styles.gridLabel}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>의료 기록</h2>
              <div className={styles.grid}>
                {MEDICAL_ITEMS.map((item) => {
                  const Illust = RECORD_ILLUSTRATIONS[item.illustration];
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`${styles.gridBtn} ${styles.gridBtnMedical}`}
                      onClick={() => handleSelectType(item)}
                    >
                      <span className={styles.gridIcon} aria-hidden="true">
                        <Illust size={34} />
                      </span>
                      <span className={styles.gridLabel}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {step === 'pet' && (
          <div className={styles.petList}>
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                className={styles.petItem}
                onClick={() => handleSelectPet(pet.id)}
              >
                {pet.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
