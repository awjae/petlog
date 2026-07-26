import type { Species } from '../api/pet.mutations';

const SPECIES_LABEL: Record<Species, string> = {
  dog: '강아지',
  cat: '고양이',
};

export function getSpeciesLabel(species: Species): string {
  return SPECIES_LABEL[species];
}

export function calcAge(birthDate: string, now: Date = new Date()): string {
  const birth = new Date(birthDate);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

  // 연/월 차이만 세면 그 달의 생일이 오기 전에도 한 달을 더 센다. 예를 들어
  // 2025-07-30생은 2026-07-26에 아직 만 1년이 아닌데 "1살"로 표시됐다.
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  // 생년월일에 미래 날짜가 들어와도 "-3개월" 같은 문자열이 화면에 나가지 않게 한다.
  if (months < 0) {
    months = 0;
  }

  if (months < 12) return `${months}개월`;
  return `${Math.floor(months / 12)}살`;
}

export function formatPetMeta(
  pet: {
    species: Species;
    breed?: string | null;
    birthDate?: string | null;
  },
  now: Date = new Date(),
): string {
  const parts = [
    getSpeciesLabel(pet.species),
    pet.breed ?? null,
    pet.birthDate ? calcAge(pet.birthDate, now) : null,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

// 최근 7일 이내면 "N일 전", 그 외에는 "M.D"
export function formatRelativeDate(iso: string, nowInput: Date = new Date()): string {
  const date = new Date(iso);
  const now = new Date(nowInput);
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}일 전`;

  const original = new Date(iso);
  return `${original.getMonth() + 1}.${original.getDate()}`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
