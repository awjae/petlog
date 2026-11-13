import type { HealthRecordType } from '@/generated/graphql';
import { readFirstTouch } from '@/shared/utils/firstTouch';

// 가입 전에 읽은 가이드·도구에 맞춰 첫 기록 유형을 고른다.
//
// 체중 가이드를 읽고 가입한 사람에게 첫 기록 화면이 기본값(체중)이 아닌 다른 유형으로 열리면,
// "그래서 어디에 적지"라는 가입 동기와 첫 화면이 어긋난다. 가이드 글을 기록 유형이 있는
// 주제로 고른 이유(#83)를 가입 이후까지 잇는다.
const RECORD_TYPE_BY_LANDING: Record<string, HealthRecordType> = {
  '/guides/dog-weight-check': 'weight',
  '/guides/pet-temperature': 'temperature',
  '/guides/pet-water-intake': 'waterIntake',
  '/guides/dog-vomit': 'vomit',
  '/guides/pet-diabetes-glucose': 'glucose',
  '/tools/daily-calories': 'weight',
  '/tools/water-intake': 'waterIntake',
};

const USED_KEY = 'petlog-first-record-type-used';

/**
 * 첫 반려동물 등록 직후 한 번만 값을 돌려준다. 두 번째 반려동물을 등록할 때까지
 * 몇 달 전에 읽은 가이드를 따라가면 오히려 어색하다.
 */
export function takeFirstRecordType(): HealthRecordType | undefined {
  try {
    if (localStorage.getItem(USED_KEY)) return undefined;
    const landingPath = readFirstTouch()?.landingPath;
    const type = landingPath ? RECORD_TYPE_BY_LANDING[landingPath] : undefined;
    if (type) localStorage.setItem(USED_KEY, '1');
    return type;
  } catch {
    return undefined;
  }
}
