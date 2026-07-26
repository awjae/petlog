import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'petlog:selected-pet';

const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // localStorage 접근 불가(시크릿 모드 등) 시 무시
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // localStorage 접근 불가(시크릿 모드 등) 시 무시
    }
  },
};

type SelectedPetState = {
  selectedPetId: string | null;
  setSelectedPetId: (petId: string) => void;
  clearSelectedPetId: (petId: string) => void;
  reset: () => void;
};

/**
 * 여러 라우트(home, reports, records/new)가 공유하는 "현재 선택된 pet" 상태.
 * 페이지 이동 후에도 유지되어야 해서 로컬 컴포넌트 상태로는 표현할 수 없고,
 * 서버 상태(Apollo)도 아니라 이 두 카테고리 사이의 클라이언트 전역 상태로 분리했다.
 */
export const useSelectedPetStore = create<SelectedPetState>()(
  persist(
    (set, get) => ({
      selectedPetId: null,
      setSelectedPetId: (petId) => set({ selectedPetId: petId }),
      clearSelectedPetId: (petId) => {
        if (get().selectedPetId === petId) set({ selectedPetId: null });
      },
      reset: () => set({ selectedPetId: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
