// filepath: src/features/home/components/PetSelector.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Pet } from '../types/home.types';
import styles from './PetSelector.module.css';

type PetSelectorProps = {
  pets: Pet[];
  selectedPetId: string;
  onSelect: (petId: string) => void;
};

export function PetSelector({ pets, selectedPetId, onSelect }: PetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? pets[0];

  function handleSelect(petId: string) {
    onSelect(petId);
    setIsOpen(false);
  }

  function handleAddPet() {
    setIsOpen(false);
    router.push('/pets/new');
  }

  return (
    <header className={styles.header}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`선택된 반려동물: ${selectedPet?.name ?? '없음'}, 변경하려면 탭`}
      >
        {selectedPet?.profileImageUrl ? (
          <Image
            src={selectedPet.profileImageUrl}
            alt={selectedPet.name}
            width={28}
            height={28}
            className={styles.avatar}
          />
        ) : (
          <span className={styles.avatarPlaceholder} aria-hidden="true">
            🐾
          </span>
        )}
        <span className={styles.name}>{selectedPet?.name ?? '반려동물 없음'}</span>
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className={styles.dropdown} role="listbox" aria-label="반려동물 선택">
            <ul className={styles.dropdownList}>
              {pets.map((pet) => (
                <li key={pet.id} role="option" aria-selected={pet.id === selectedPetId}>
                  <button
                    className={`${styles.dropdownItem} ${pet.id === selectedPetId ? styles.dropdownItemActive : ''}`}
                    onClick={() => handleSelect(pet.id)}
                  >
                    {pet.profileImageUrl ? (
                      <Image
                        src={pet.profileImageUrl}
                        alt={pet.name}
                        width={36}
                        height={36}
                        className={styles.dropdownAvatar}
                      />
                    ) : (
                      <span className={styles.dropdownAvatarPlaceholder} aria-hidden="true">
                        🐾
                      </span>
                    )}
                    <span className={styles.dropdownName}>{pet.name}</span>
                    {pet.id === selectedPetId && (
                      <span className={styles.dropdownActiveMark} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.divider} />
            <button className={styles.addButton} onClick={handleAddPet}>
              <span className={styles.addIcon} aria-hidden="true">
                +
              </span>
              반려동물 추가
            </button>
          </div>
        </>
      )}
    </header>
  );
}
