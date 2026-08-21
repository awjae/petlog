'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft } from 'lucide-react';
import { RECORD_TYPE_ICONS, type RecordIconKey } from '@/shared/components/recordTypeIcons';
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
  icon: RecordIconKey;
  href: (petId: string) => string;
}

const DAILY_ITEMS: SheetItem[] = [
  { label: '체중', icon: 'weight', href: (id) => `/records/new?type=weight&petId=${id}` },
  {
    label: '식사',
    icon: 'appetite',
    href: (id) => `/records/new?type=appetite&petId=${id}`,
  },
  {
    label: '산책',
    icon: 'activity',
    href: (id) => `/records/new?type=activity&petId=${id}`,
  },
  { label: '메모', icon: 'mood', href: (id) => `/records/new?type=mood&petId=${id}` },
  { label: '증상', icon: 'symptom', href: (id) => `/records/new?type=symptom&petId=${id}` },
  { label: '배변', icon: 'stool', href: (id) => `/records/new?type=stool&petId=${id}` },
  { label: '구토', icon: 'vomit', href: (id) => `/records/new?type=vomit&petId=${id}` },
];

const MEDICAL_ITEMS: SheetItem[] = [
  { label: '병원 방문', icon: 'hospital', href: (id) => `/pets/${id}/medical/new` },
  {
    label: '예방접종',
    icon: 'vaccination',
    href: (id) => `/pets/${id}/medical/vaccinations/new`,
  },
  {
    label: '병원 예약',
    icon: 'appointment',
    href: (id) => `/pets/${id}/medical/appointments/new`,
  },
  { label: '투약', icon: 'medication', href: (id) => `/pets/${id}/medications/new` },
];

type Step = 'type' | 'pet';

export function RecordTypeSelectSheet({ isOpen, onClose, pets }: RecordTypeSelectSheetProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type');
  const [pendingItem, setPendingItem] = useState<SheetItem | null>(null);

  // 열릴 때마다 1단계로 되돌린다(전환 상태는 BottomSheet이 관리).
  useEffect(() => {
    if (!isOpen) return;
    setStep('type');
    setPendingItem(null);
  }, [isOpen]);

  function handleBackToType() {
    setStep('type');
    setPendingItem(null);
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="기록 유형 선택" maxHeight="85dvh">
      {({ close, closeWith }) => {
        // 닫히는 애니메이션이 끝난 뒤 이동한다. 바로 push하면 시트가 남은 채 화면이 바뀐다.
        function leaveTo(href: string) {
          closeWith(() => {
            onClose();
            router.push(href);
          });
        }

        function handleSelectType(item: SheetItem) {
          if (pets.length === 0) {
            leaveTo('/pets/new');
            return;
          }

          if (pets.length === 1) {
            leaveTo(item.href(pets[0].id));
            return;
          }

          setPendingItem(item);
          setStep('pet');
        }

        function handleSelectPet(petId: string) {
          if (!pendingItem) return;
          leaveTo(pendingItem.href(petId));
        }

        return (
          <>
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
              <button type="button" className={styles.closeBtn} onClick={close} aria-label="닫기">
                <X size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </header>

            {step === 'type' && (
              <div className={styles.body}>
                <section className={styles.section}>
                  <h2 className={styles.sectionLabel}>일상 / 건강 기록</h2>
                  <div className={styles.grid}>
                    {DAILY_ITEMS.map((item) => {
                      const Icon = RECORD_TYPE_ICONS[item.icon];
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.gridBtn}
                          onClick={() => handleSelectType(item)}
                        >
                          <span className={styles.gridIcon} aria-hidden="true">
                            <Icon size={24} strokeWidth={1.75} />
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
                      const Icon = RECORD_TYPE_ICONS[item.icon];
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={`${styles.gridBtn} ${styles.gridBtnMedical}`}
                          onClick={() => handleSelectType(item)}
                        >
                          <span className={styles.gridIcon} aria-hidden="true">
                            <Icon size={24} strokeWidth={1.75} />
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
          </>
        );
      }}
    </BottomSheet>
  );
}
