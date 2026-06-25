// filepath: src/features/home/components/PetSummaryCard.tsx

import Link from 'next/link';
import Image from 'next/image';
import type { Pet } from '../types/home.types';
import styles from './PetSummaryCard.module.css';

type PetSummaryCardProps = {
  pet: Pet;
};

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}개월`;
  return `${Math.floor(months / 12)}살`;
}

function formatWeightDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} 기준`;
}

const SPECIES_LABEL: Record<Pet['species'], string> = {
  dog: '강아지',
  cat: '고양이',
  other: '기타',
};

export function PetSummaryCard({ pet }: PetSummaryCardProps) {
  const agePart = pet.birthDate ? calcAge(pet.birthDate) : null;
  const speciesPart = SPECIES_LABEL[pet.species];
  const metaParts = [speciesPart, pet.breed, agePart].filter(Boolean).join(' · ');

  return (
    <article className={styles.card}>
      <Link href={`/pets/${pet.id}`} className={styles.link} aria-label={`${pet.name} 상세 보기`}>
        <div className={styles.top}>
          {pet.profileImageUrl ? (
            <Image
              src={pet.profileImageUrl}
              alt={pet.name}
              width={72}
              height={72}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatarPlaceholder} aria-hidden="true">
              🐾
            </span>
          )}
          <div className={styles.info}>
            <h2 className={styles.name}>{pet.name}</h2>
            {metaParts && <p className={styles.meta}>{metaParts}</p>}
          </div>
        </div>

        <div className={styles.divider} />

        {pet.recentWeight ? (
          <div className={styles.weightRow}>
            <span className={styles.weightLabel}>체중</span>
            <span className={styles.weightValue}>{pet.recentWeight.value} kg</span>
            <span className={styles.weightDate}>
              {formatWeightDate(pet.recentWeight.recordedAt)}
            </span>
          </div>
        ) : (
          <p className={styles.noWeight}>체중 기록 없음</p>
        )}
      </Link>
    </article>
  );
}
