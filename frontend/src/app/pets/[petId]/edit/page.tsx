'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, Dog, Cat, type LucideIcon } from 'lucide-react';
import { usePetEdit, usePetIds } from '@/features/pet/hooks/usePet';
import { useUpdatePet } from '@/features/pet/hooks/useUpdatePet';
import { useImageSelection } from '@/features/pet/hooks/useImageSelection';
import { BREEDS_BY_SPECIES, BREED_SELECT_HINT } from '@/features/pet/types/breeds';
import { DeletePetConfirmDialog } from '@/features/pet/components/DeletePetConfirmDialog';
import { useToast, ToastContainer } from '@/features/shared/components/Toast';
import { localToday } from '@/shared/utils/date';
import styles from './page.module.css';

type Species = 'dog' | 'cat';
type Gender = 'male' | 'female' | null;

const SPECIES_OPTIONS: { value: Species; Icon: LucideIcon; label: string }[] = [
  { value: 'dog', Icon: Dog, label: '강아지' },
  { value: 'cat', Icon: Cat, label: '고양이' },
];

export default function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const { pet, loading: fetchLoading, error: fetchError, notFound } = usePetEdit(petId);
  const { petCount } = usePetIds();
  const { updatePet, loading: saving } = useUpdatePet();
  const { toasts, addToast, dismiss } = useToast();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [neutered, setNeutered] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { imageFile, previewUrl, imageError, selectFile, showStoredImage, handlePreviewError } =
    useImageSelection();

  useEffect(() => {
    if (!pet || initialized) return;
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed ?? '');
    setBirthDate(pet.birthDate ? pet.birthDate.slice(0, 10) : '');
    setGender(pet.gender === 'unknown' ? null : pet.gender);
    setNeutered(pet.isNeutered);
    showStoredImage(pet.profileImageUrl ?? null);
    setInitialized(true);
  }, [pet, initialized, showStoredImage]);

  function isValid() {
    return name.trim().length >= 1;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void selectFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('이름을 입력해주세요');
      return;
    }
    setNameError('');

    const ok = await updatePet(petId, {
      name,
      species,
      breed,
      birthDate,
      gender,
      isNeutered: neutered,
      imageFile,
      existingProfileImageUrl: pet?.profileImageUrl ?? null,
    });

    if (ok) {
      router.push(`/pets/${petId}`);
    } else {
      addToast('정보를 저장하지 못했어요. 다시 시도해주세요.', 'error');
    }
  }

  /* ── 반려동물을 찾을 수 없음 ── */
  if (notFound) {
    return (
      <main className={styles.centerMain} aria-label="반려동물을 찾을 수 없음">
        <p className={styles.notFoundText}>반려동물을 찾을 수 없어요</p>
        <button type="button" className={styles.homeBtn} onClick={() => router.push('/home')}>
          홈으로
        </button>
      </main>
    );
  }

  /* ── 네트워크 오류(최초 로딩 실패) ── */
  if (fetchError && !pet) {
    return (
      <main className={styles.centerMain} aria-label="정보 수정">
        <p className={styles.notFoundText}>정보를 불러오지 못했어요</p>
        <button type="button" className={styles.homeBtn} onClick={() => router.back()}>
          돌아가기
        </button>
      </main>
    );
  }

  const isLoadingFields = fetchLoading && !initialized;

  return (
    <main className={styles.main} aria-label="반려동물 정보 수정">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>정보 수정</h1>
        <div className={styles.headerRight} aria-hidden="true" />
      </header>

      <form
        onSubmit={handleSubmit}
        className={styles.form}
        data-loading={isLoadingFields ? 'true' : undefined}
        noValidate
      >
        {/* ── 프로필 사진 ── */}
        <div className={styles.avatarWrap}>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
            disabled={isLoadingFields}
            aria-label="프로필 사진 선택"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="미리보기"
                className={styles.avatarImg}
                onError={handlePreviewError}
              />
            ) : (
              <span className={styles.avatarPlaceholder} aria-hidden="true">
                <Camera size={32} strokeWidth={1.5} />
              </span>
            )}
          </button>
          {imageError ? (
            <p className={styles.avatarError} role="alert">
              {imageError}
            </p>
          ) : (
            <p className={styles.avatarHint}>사진 변경</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={isLoadingFields}
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
            className={`${styles.input} ${nameError ? styles.inputError : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="예) 초코, 뭉치"
            maxLength={20}
            disabled={isLoadingFields}
            required
          />
          {nameError && (
            <p className={styles.fieldError} role="alert">
              {nameError}
            </p>
          )}
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
                onClick={() => {
                  setSpecies(opt.value);
                  setBreed('');
                }}
                disabled={isLoadingFields}
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
          <select
            id="pet-breed"
            className={styles.select}
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            disabled={isLoadingFields}
          >
            <option value="">선택 안 함</option>
            {BREEDS_BY_SPECIES[species].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className={styles.breedHint}>{BREED_SELECT_HINT}</p>
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
            max={localToday()}
            disabled={isLoadingFields}
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
                disabled={isLoadingFields}
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
              disabled={isLoadingFields}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        {/* ── 반려동물 삭제 ── */}
        <button
          type="button"
          className={styles.deleteLink}
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoadingFields}
        >
          반려동물 삭제
        </button>

        <div className={styles.footer}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isValid() || saving || isLoadingFields}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {showDeleteDialog && pet && (
        <DeletePetConfirmDialog
          petId={petId}
          petName={pet.name}
          isLastPet={petCount === 1}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
