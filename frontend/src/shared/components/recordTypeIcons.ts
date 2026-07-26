import {
  Scale,
  Utensils,
  Footprints,
  NotebookPen,
  Thermometer,
  Droplets,
  Waves,
  Stethoscope,
  Syringe,
  CalendarClock,
  Pill,
  ClipboardPlus,
  type LucideIcon,
} from 'lucide-react';

/**
 * 기록 종류 → 아이콘 매핑의 단일 출처.
 *
 * 같은 "체중 기록"이 홈에서는 저울, 캘린더에서는 컬러 일러스트로 보이던 문제를 없애기 위해
 * 화면이 아니라 도메인 개념을 기준으로 아이콘을 고정한다. 새 기록 종류가 생기면 이 파일에만
 * 추가하고, 화면은 여기서 가져다 쓴다.
 *
 * 아이콘 언어는 lucide 라인 아이콘으로 통일한다 — 리스트처럼 정보 밀도가 높은 화면에서
 * 컬러 일러스트보다 훑어보기 쉽고, 색은 상태(선택/경고)를 표현하는 데만 남겨둔다.
 */
export type RecordIconKey =
  // 일상/건강 기록
  | 'weight'
  | 'appetite'
  | 'activity'
  | 'mood'
  | 'symptom'
  | 'stool'
  | 'vomit'
  // 의료 기록
  | 'hospital'
  | 'vaccination'
  | 'appointment'
  | 'medication'
  // 종류를 특정하지 않은 건강 기록 일반
  | 'healthRecord';

export const RECORD_TYPE_ICONS: Record<RecordIconKey, LucideIcon> = {
  weight: Scale,
  appetite: Utensils,
  activity: Footprints,
  mood: NotebookPen,
  symptom: Thermometer,
  stool: Droplets,
  vomit: Waves,
  hospital: Stethoscope,
  vaccination: Syringe,
  appointment: CalendarClock,
  medication: Pill,
  healthRecord: ClipboardPlus,
};
