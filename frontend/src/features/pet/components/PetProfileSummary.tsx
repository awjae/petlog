import Image from 'next/image';
import { PawPrint } from 'lucide-react';
import type { PetDetail } from '../types/pet.types';
import { formatPetMeta } from '../utils/petMeta';
import styles from './PetProfileSummary.module.css';

interface PetProfileSummaryProps {
  pet: PetDetail;
}

const GENDER_LABEL: Record<PetDetail['gender'], string | null> = {
  male: '수컷',
  female: '암컷',
  unknown: null,
};

export function PetProfileSummary({ pet }: PetProfileSummaryProps) {
  const meta = formatPetMeta(pet);
  const genderLabel = GENDER_LABEL[pet.gender];

  return (
    <section className={styles.wrapper} aria-label="반려동물 프로필">
      {pet.profileImageUrl ? (
        <Image
          src={pet.profileImageUrl}
          alt={pet.name}
          width={96}
          height={96}
          className={styles.avatar}
        />
      ) : (
        <span className={styles.avatarPlaceholder} aria-hidden="true">
          <PawPrint size={36} strokeWidth={1.5} />
        </span>
      )}

      <h2 className={styles.name}>{pet.name}</h2>
      {meta && <p className={styles.meta}>{meta}</p>}

      {(genderLabel || pet.isNeutered) && (
        <div className={styles.badgeRow}>
          {genderLabel && <span className={styles.badge}>{genderLabel}</span>}
          {pet.isNeutered && <span className={styles.badge}>중성화 완료</span>}
        </div>
      )}
    </section>
  );
}
