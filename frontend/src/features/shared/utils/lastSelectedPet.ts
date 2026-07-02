const STORAGE_KEY = 'petlog:lastSelectedPetId';

export function getLastSelectedPetId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastSelectedPetId(petId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, petId);
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) 시 무시
  }
}
