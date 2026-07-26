// 기록 추가 화면의 선택지 목록. 화면(app/records/new/page.tsx)에 인라인으로 있던 것을 옮겼다.
// 기록 유형이 늘어날 때 화면 파일이 아니라 이 파일만 보면 되도록 한다.
//
// 타입은 새로 만들지 않고 API 계약의 HealthRecordType을 그대로 쓴다 —
// 화면에서만 쓰는 별도 union을 두면 서버가 받지 못하는 값을 만들 수 있다.
import { Smile, Meh, Frown, Circle, CircleAlert, CircleX, type LucideIcon } from 'lucide-react';
import { RECORD_TYPE_ICONS } from '@/shared/components/recordTypeIcons';
import type { HealthRecordType, AppetiteLevel } from '../api/health-record.mutations';

export const DAILY_TYPES: { type: HealthRecordType; Icon: LucideIcon; label: string }[] = [
  { type: 'weight', Icon: RECORD_TYPE_ICONS.weight, label: '체중' },
  { type: 'appetite', Icon: RECORD_TYPE_ICONS.appetite, label: '식사' },
  { type: 'activity', Icon: RECORD_TYPE_ICONS.activity, label: '산책' },
  { type: 'mood', Icon: RECORD_TYPE_ICONS.mood, label: '메모' },
];

export const HEALTH_TYPES: { type: HealthRecordType; Icon: LucideIcon; label: string }[] = [
  { type: 'symptom', Icon: RECORD_TYPE_ICONS.symptom, label: '증상' },
  { type: 'stool', Icon: RECORD_TYPE_ICONS.stool, label: '배변' },
  { type: 'vomit', Icon: RECORD_TYPE_ICONS.vomit, label: '구토' },
];

export const APPETITE_OPTIONS: { value: AppetiteLevel; Icon: LucideIcon; label: string }[] = [
  { value: 'good', Icon: Smile, label: '잘 먹음' },
  { value: 'normal', Icon: Meh, label: '보통' },
  { value: 'bad', Icon: Frown, label: '안 먹음' },
];

export const SYMPTOM_OPTIONS = [
  '기침/재채기',
  '구토',
  '설사',
  '콧물/눈곱',
  '다리를 저는 행동',
  '무기력/처짐',
  '과도한 긁음',
  '배가 부어 보임',
  '기타',
];

// 색은 토큰으로만 지정한다. iOS 기본색을 인라인으로 박아두면 팔레트가 바뀌어도
// 여기만 남고, 무엇보다 흰 글씨를 얹었을 때 대비가 2:1 대까지 떨어진다.
// 선택 상태는 "상태색 틴트 면 + 같은 계열 진한 글씨"로 표현한다.
export const SEVERITY_OPTIONS: {
  value: 1 | 2 | 3;
  label: string;
  Icon: LucideIcon;
  tone: 'success' | 'warning' | 'danger';
}[] = [
  { value: 1, label: '경미함', Icon: Circle, tone: 'success' },
  { value: 2, label: '보통', Icon: CircleAlert, tone: 'warning' },
  { value: 3, label: '심각함', Icon: CircleX, tone: 'danger' },
];

export const STOOL_TYPES = ['정상', '무름', '설사', '혈변', '변비'];

export const VOMIT_CONTENTS = [
  '사료 / 음식',
  '풀 / 이물질',
  '노란 액체',
  '흰 거품',
  '피가 섞임',
  '모르겠음',
];

export const COUNT_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '1회' },
  { value: 2, label: '2-3회' },
  { value: 3, label: '4회 이상' },
];

export const VALID_TYPES: HealthRecordType[] = [
  'weight',
  'appetite',
  'activity',
  'mood',
  'symptom',
  'stool',
  'vomit',
];
