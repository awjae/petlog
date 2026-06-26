'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Dog, Cat, type LucideIcon } from 'lucide-react';
import { useCreatePet } from '@/features/pet/hooks/useCreatePet';
import styles from './page.module.css';

type Species = 'dog' | 'cat';
type Gender = 'male' | 'female' | null;

const SPECIES_OPTIONS: { value: Species; Icon: LucideIcon; label: string }[] = [
  { value: 'dog', Icon: Dog, label: '강아지' },
  { value: 'cat', Icon: Cat, label: '고양이' },
];

export default function NewPetPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { createPet, loading, error } = useCreatePet();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [neutered, setNeutered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function isValid() {
    return name.trim().length >= 1;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    const ok = await createPet({
      name,
      species,
      breed,
      birthDate,
      gender,
      isNeutered: neutered,
      imageFile,
    });
    if (ok) router.push('/home');
  }

  return (
    <main className={styles.main} aria-label="반려동물 등록">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>반려동물 등록</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* ── 프로필 사진 ── */}
        <div className={styles.avatarWrap}>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
            aria-label="프로필 사진 선택"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="미리보기" className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarPlaceholder} aria-hidden="true">
                <Camera size={32} strokeWidth={1.5} />
              </span>
            )}
          </button>
          <p className={styles.avatarHint}>사진 추가 (선택)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleFileChange}
            aria-label="프로필 사진 업로드"
          />
        </div>

        {/* ── 이름 ── */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pet-name">
            이름 <span className={styles.required}>*</span>
          </label>
          <input
            id="pet-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 초코, 뭉치"
            maxLength={20}
            required
          />
        </div>

        {/* ── 종류 ── */}
        <div className={styles.fieldGroup}>
          <p className={styles.label}>종류</p>
          <div className={styles.speciesGrid} role="group" aria-label="종류 선택">
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.speciesBtn} ${species === opt.value ? styles.speciesBtnActive : ''}`}
                onClick={() => setSpecies(opt.value)}
                aria-pressed={species === opt.value}
              >
                <opt.Icon
                  size={22}
                  strokeWidth={1.5}
                  className={styles.speciesIcon}
                  aria-hidden="true"
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 품종 ── */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pet-breed">
            품종 <span className={styles.optional}>(선택)</span>
          </label>
          <input
            id="pet-breed"
            type="text"
            className={styles.input}
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder={species === 'dog' ? '예) 말티즈, 포메라니안' : '예) 코리안 숏헤어'}
            maxLength={30}
          />
        </div>

        {/* ── 생년월일 ── */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pet-birth">
            생년월일 <span className={styles.optional}>(선택)</span>
          </label>
          <input
            id="pet-birth"
            type="date"
            className={styles.input}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* ── 성별 ── */}
        <div className={styles.fieldGroup}>
          <p className={styles.label}>
            성별 <span className={styles.optional}>(선택)</span>
          </p>
          <div className={styles.segmented} role="group" aria-label="성별 선택">
            {[
              { value: 'male' as Gender, label: '수컷' },
              { value: 'female' as Gender, label: '암컷' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.segBtn} ${gender === opt.value ? styles.segBtnActive : ''}`}
                onClick={() => setGender(gender === opt.value ? null : opt.value)}
                aria-pressed={gender === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 중성화 ── */}
        <div className={styles.fieldGroup}>
          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel} htmlFor="neutered">
              중성화 완료
            </label>
            <button
              id="neutered"
              type="button"
              role="switch"
              aria-checked={neutered}
              className={`${styles.toggle} ${neutered ? styles.toggleOn : ''}`}
              onClick={() => setNeutered((v) => !v)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        {error && (
          <p className={styles.errorMsg} role="alert">
            {error}
          </p>
        )}

        <div className={styles.footer}>
          <button type="submit" className={styles.submitBtn} disabled={!isValid() || loading}>
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </main>
  );
}
