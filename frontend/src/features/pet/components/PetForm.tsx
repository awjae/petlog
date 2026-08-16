'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, Dog, Cat, type LucideIcon } from 'lucide-react';
import { useImageSelection } from '../hooks/useImageSelection';
import { BREEDS_BY_SPECIES, BREED_SELECT_HINT } from '../types/breeds';
import type { Gender, Species } from '../api/pet.mutations';
import { useLocalToday } from '@/shared/hooks/useLocalToday';
import styles from './PetForm.module.css';

/**
 * 반려동물 등록/수정 폼.
 *
 * 두 화면이 필드 6개와 사진 선택을 통째로 복제하고 있었다 — 상태, 검증,
 * SPECIES_OPTIONS, 입력 JSX, 그리고 CSS 규칙 35개까지 글자 그대로 같았다.
 * 품종 하나를 늘려도 한쪽만 고치면 다른 화면이 조용히 뒤처지는 구조였다.
 *
 * 화면마다 다른 건 껍데기(제목, 삭제 링크, 저장 후 이동)뿐이라 그건 페이지에 남겼다.
 */

// 성별은 서버 스키마상 'unknown'을 포함하지만, 화면에서는 "고르지 않음"을 null로 다룬다.
export type PetFormGender = Exclude<Gender, 'unknown'> | null;

export interface PetFormValues {
  name: string;
  species: Species;
  breed: string;
  birthDate: string;
  gender: PetFormGender;
  isNeutered: boolean;
  imageFile: File | null;
}

export interface PetFormInitialValues {
  name: string;
  species: Species;
  breed: string | null;
  /** ISO 문자열. 앞 10자리만 쓴다 */
  birthDate: string | null;
  gender: Gender;
  isNeutered: boolean;
  profileImageUrl: string | null;
}

interface PetFormProps {
  /** 수정 화면에서 서버 값이 도착하면 한 번만 채운다. 등록 화면은 넘기지 않는다 */
  initialValues?: PetFormInitialValues | null;
  /** 값을 불러오는 동안 입력을 잠근다 */
  disabled?: boolean;
  /** 사진 영역 안내 문구 — 등록은 "사진 추가 (선택)", 수정은 "사진 변경" */
  avatarHint: string;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  /** 제출 실패 안내 (등록 화면) */
  error?: string;
  /** 제출 버튼 위에 덧붙일 것 — 수정 화면의 삭제 링크 */
  children?: ReactNode;
  onSubmit: (values: PetFormValues) => void;
}

const SPECIES_OPTIONS: { value: Species; Icon: LucideIcon; label: string }[] = [
  { value: 'dog', Icon: Dog, label: '강아지' },
  { value: 'cat', Icon: Cat, label: '고양이' },
];

const GENDER_OPTIONS: { value: Exclude<PetFormGender, null>; label: string }[] = [
  { value: 'male', label: '수컷' },
  { value: 'female', label: '암컷' },
];

export function PetForm({
  initialValues,
  disabled = false,
  avatarHint,
  submitLabel,
  submittingLabel,
  submitting,
  error,
  children,
  onSubmit,
}: PetFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  // max는 렌더 중에 계산하면 하이드레이션에서 서버 값이 굳는다 (useLocalToday 주석 참고).
  const maxDate = useLocalToday();
  const [gender, setGender] = useState<PetFormGender>(null);
  const [neutered, setNeutered] = useState(false);
  const [nameError, setNameError] = useState('');

  const { imageFile, previewUrl, imageError, selectFile, showStoredImage, handlePreviewError } =
    useImageSelection();

  useEffect(() => {
    if (!initialValues || initialized) return;
    setName(initialValues.name);
    setSpecies(initialValues.species);
    setBreed(initialValues.breed ?? '');
    setBirthDate(initialValues.birthDate ? initialValues.birthDate.slice(0, 10) : '');
    setGender(initialValues.gender === 'unknown' ? null : initialValues.gender);
    setNeutered(initialValues.isNeutered);
    showStoredImage(initialValues.profileImageUrl ?? null);
    setInitialized(true);
  }, [initialValues, initialized, showStoredImage]);

  const isValid = name.trim().length >= 1;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void selectFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('이름을 입력해주세요');
      return;
    }
    setNameError('');
    onSubmit({ name, species, breed, birthDate, gender, isNeutered: neutered, imageFile });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
      data-loading={disabled ? 'true' : undefined}
      noValidate
    >
      {/* ── 프로필 사진 ── */}
      <div className={styles.avatarWrap}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
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
          <p className={styles.avatarHint}>{avatarHint}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleFileChange}
          disabled={disabled}
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
          disabled={disabled}
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
              disabled={disabled}
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
          disabled={disabled}
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
          max={maxDate}
          disabled={disabled}
        />
      </div>

      {/* ── 성별 ── */}
      <div className={styles.fieldGroup}>
        <p className={styles.label}>
          성별 <span className={styles.optional}>(선택)</span>
        </p>
        <div className={styles.segmented} role="group" aria-label="성별 선택">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.segBtn} ${gender === opt.value ? styles.segBtnActive : ''}`}
              onClick={() => setGender(gender === opt.value ? null : opt.value)}
              disabled={disabled}
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
            disabled={disabled}
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

      {children}

      <div className={styles.footer}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isValid || submitting || disabled}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
