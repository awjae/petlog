# Decision: 서버는 단일 서비스 타임존(Asia/Seoul)을 가정한다

## Status

결정됨 (2026-07-30).

---

## Context

`countTodayRecords`가 KST 새벽(00~09시)에 어제 기록을 오늘로 집계하는 버그를 고치면서
`kstDayRange`를 도입했다. 이때 "서버에 KST를 박으면 한국 전용 서비스가 되는 것이
아닌가"라는 질문이 나왔다.

답은 "그렇다"다. 다만 정확히 짚을 것이 있다.

### 이전에도 단일 타임존이었다

수정 전 코드는 타임존 중립이 아니었다. `new Date()` + `setHours(0,0,0,0)`은 프로세스
TZ를 따르고, 컨테이너 TZ는 UTC다(어디에도 지정하지 않았고 ECS Fargate 기본값이 UTC).
즉 **UTC에 실제로 사는 사용자에게만 맞는 계산**이었다.

이번 변경은 "중립 → KST"가 아니라 **"UTC 고정 → KST 고정"**이다. 실제 사용자
기준으로는 틀린 것에서 맞는 것으로 바뀌었고, 비한국 사용자 기준으로는 전에도
틀렸고 지금도 틀리다.

### 클라이언트는 이미 타임존 무관이다

`frontend/src/shared/utils/date.ts`는 `Asia/Seoul`을 박지 않는다. 기기 로컬 시간대를
쓰므로 어디서든 사용자가 기대하는 날짜가 나온다. 제약은 서버 쪽만이다.

---

## Decision

**서버는 단일 서비스 타임존을 가정한다. 그 값은 Asia/Seoul이다.**

per-user 타임존을 지금 도입하지 않는다. 이유:

- 한국 시장 제품이다. 품종 목록(`BREEDS_BY_SPECIES`), 수의사 상담 문구, UI 전체가
  한국어다. 비한국 사용자는 0명이다.
- 도입 비용이 스키마 마이그레이션 + 알림 스캐너 재설계까지 번진다(아래 참고).
- 요청되지 않은 유연성을 미리 만들지 않는다는 원칙에 정면으로 걸린다.

### 이름을 `kstDayRange`로 둔 이유

`serviceDayRange` 같은 중립적인 이름이 더 그럴듯해 보이지만, 지금 구현은 **고정
오프셋(+9h) 산술**이다. 한국에 서머타임이 없어서 성립하는 방식이므로, 중립적인
이름은 실제보다 넓은 적용 범위를 약속하게 된다.

`countTodayRecords()`가 `kstDayRange()`를 호출하는 코드는 제약을 호출부에서 바로
드러낸다. 이 노출은 단점이 아니라 의도된 것이다.

---

## 영향받는 지점

### 이번에 명시적으로 만든 곳

| 위치 | 내용 |
| --- | --- |
| `pet.service.ts` `countTodayRecords` | 홈 화면 `todayRecordCount` |
| `notification.service.ts` `scanAndSendVaccinationDue` | 접종 예정일 당일 판정 |
| `notification.service.ts` `scanAndSendAppointmentReminder` | 병원 방문 당일 판정 |
| `notification.scheduler.ts` `@Cron` | 발송 시각 (KST 09:00) |

### 이전부터 암묵적으로 가정하던 곳

아래는 `.toISOString().slice(0, 10)`으로 UTC 날짜를 뽑는다. 프론트엔드가 로컬 정오를
앵커로 저장하기 때문에(`useCreateHealthRecord.ts`) KST에서만 우연히 맞는다. UTC-8
사용자라면 정오 앵커가 20:00Z가 되어 날짜가 하루 밀린다.

| 위치 | 내용 |
| --- | --- |
| `report.service.ts:49,154,244` | `distinctDates` 기록일 수 집계 |
| `llm-health-report.generator.ts:140,141,146` | AI 프롬프트의 기간·최근 진료일 |
| `user.resolver.ts:90` | 캘린더 이벤트 날짜 |

이 5곳은 이번 PR에서 손대지 않았다. 지금 동작이 맞고, 고치려면 per-user 타임존이
전제되어야 한다.

---

## 다국가 전환 시 필요한 작업

이 결정을 되돌릴 때 필요한 순서다. 부분만 하면 화면마다 날짜가 어긋난다.

1. **`User.timezone` (IANA 문자열) 스키마 마이그레이션.** 가입 시 클라이언트의
   `Intl.DateTimeFormat().resolvedOptions().timeZone`을 받아 저장하고, 설정 화면에서
   변경할 수 있게 한다. 기존 사용자는 `Asia/Seoul`로 백필한다.
2. **일자 경계 계산에 사용자 TZ 전달.** 위 표의 8곳 전부. 조회 시점에 사용자를
   알 수 있는 경로인지 먼저 확인해야 한다 — `countTodayRecords`는 `petId`만 받으므로
   `Pet → User` 조회가 추가된다.
3. **고정 오프셋 산술을 IANA 기반으로 교체.** `KST_OFFSET_MS` 상수 방식은 서머타임이
   없는 타임존에서만 성립한다. 임의 타임존을 허용하는 순간 DST 전환일에 조용히
   깨지므로 `Intl` 기반 오프셋 계산으로 바꿔야 한다.
4. **알림 스캐너 재설계.** 지금은 하루 1회 단일 시각에 전체를 훑는다. 사용자마다
   아침 9시가 다르면 시간별 실행 + 사용자 TZ 필터로 바꿔야 한다. 중복 발송 방지
   로직(`referenceId` 기준 이력 체크)이 시간별 실행에서도 성립하는지 재검증이 필요하다.

---

## 참고

- 프론트엔드의 같은 계열 버그 수정: `shared/utils/date.ts`
- `kstDayRange`가 프로세스 TZ에 의존하지 않는 이유는 `common/utils/date.ts` 주석에 있다.
  스펙이 TZ 고정 없이 통과하는 것 자체가 그 성질의 회귀 신호다.
