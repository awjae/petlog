import type { Species } from '../api/pet.mutations';

const SPECIES_LABEL: Record<Species, string> = {
  dog: '강아지',
  cat: '고양이',
};

export function getSpeciesLabel(species: Species): string {
  return SPECIES_LABEL[species];
}

export function calcAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}개월`;
  return `${Math.floor(months / 12)}살`;
}

export function formatPetMeta(pet: {
  species: Species;
  breed?: string | null;
  birthDate?: string | null;
}): string {
  const parts = [
    getSpeciesLabel(pet.species),
    pet.breed ?? null,
    pet.birthDate ? calcAge(pet.birthDate) : null,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}

// 최근 7일 이내면 "N일 전", 그 외에는 "M.D"
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
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
