// 기록 추가 화면의 선택지 목록. 화면(app/records/new/page.tsx)에 인라인으로 있던 것을 옮겼다.
// 기록 유형이 늘어날 때 화면 파일이 아니라 이 파일만 보면 되도록 한다.
//
// 유형은 화면용 union을 새로 만들지 않고 HealthRecordType을 그대로 쓴다 — 이건 실제로
// wire 타입이라(스키마의 enum HealthRecordType) 화면이 임의 값을 만들면 서버가 거부한다.
import { Smile, Meh, Frown, Circle, CircleAlert, CircleX, type LucideIcon } from 'lucide-react';
import { RECORD_TYPE_ICONS } from '@/shared/components/recordTypeIcons';
import type { HealthRecordType } from '@/generated/graphql';
import { TYPE_LABEL, type AppetiteChoice } from '../types/health-record.types';

// 유형이 어느 묶음에 들어가는지만 여기서 정한다. 아이콘은 RECORD_TYPE_ICONS,
// 이름은 TYPE_LABEL이 단일 출처다.
//
// 목록을 배열로 직접 나열하면 유형이 추가돼도 컴파일러가 안 잡아서 화면에서만 조용히
// 빠진다. Record로 두면 누락 시 컴파일이 깨진다.
const TYPE_GROUP: Record<HealthRecordType, 'daily' | 'health'> = {
  weight: 'daily',
  appetite: 'daily',
  activity: 'daily',
  mood: 'daily',
  symptom: 'health',
  stool: 'health',
  vomit: 'health',
  glucose: 'health',
  temperature: 'health',
  // 음수량은 증상이 아니라 매일 남기는 값이라 일상 묶음에 둔다. 신부전·당뇨의
  // 초기 신호가 음수량 증가지만, 그건 리포트가 판단할 일이지 입력 분류가 할 일은 아니다.
  waterIntake: 'daily',
};

// 혈당·체온·음수량은 셋 다 "숫자 하나 + 단위"라 입력 UI가 같다. 유형마다 JSX를
// 복사하는 대신 명세만 두고 화면은 한 번만 그린다.
//
// 체중은 기존 입력 블록을 그대로 둔다 — weight/setWeight 상태 이름이 화면·훅·뮤테이션에
// 걸쳐 있어 여기로 합치려면 이 변경의 범위를 벗어난다.
//
// min/max는 입력 실수를 막는 범위일 뿐 정상 범위가 아니다. 정상 범위 판정은 종·나이·
// 기저질환에 따라 달라서 앱이 할 일이 아니다(Product Positioning: 의료 판단을 하지 않는다).
export const NUMERIC_FIELDS = {
  glucose: { unit: 'mg/dL', step: '1', min: '0', max: '800', placeholder: '0' },
  temperature: { unit: '°C', step: '0.1', min: '30', max: '45', placeholder: '38.5' },
  waterIntake: { unit: 'mL', step: '10', min: '0', max: '5000', placeholder: '0' },
} as const;

export type NumericFieldType = keyof typeof NUMERIC_FIELDS;

export function isNumericField(type: HealthRecordType): type is NumericFieldType {
  return type in NUMERIC_FIELDS;
}

function typesInGroup(group: 'daily' | 'health') {
  return (Object.keys(TYPE_GROUP) as HealthRecordType[])
    .filter((type) => TYPE_GROUP[type] === group)
    .map((type) => ({ type, Icon: RECORD_TYPE_ICONS[type], label: TYPE_LABEL[type] }));
}

export const DAILY_TYPES = typesInGroup('daily');

export const HEALTH_TYPES = typesInGroup('health');

export const APPETITE_OPTIONS: { value: AppetiteChoice; Icon: LucideIcon; label: string }[] = [
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
