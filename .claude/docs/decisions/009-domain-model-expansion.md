# Decision: 도메인 모델 확장 — 리텐션 중심 설계

## Context

초기 스키마는 핵심 도메인 5개로 구성됐다.

```
User → Pet → HealthRecord / MedicalEvent / Medication / Report
```

이 구조는 "기록 보관함"으로서는 충분하지만, 사용자가 앱을 반복해서 열 이유가 없다.

반려동물 앱에서 리텐션의 핵심은 "다음에 해야 할 일"을 알려주는 것이다.

---

## Problem

현재 구조의 한계:

1. 예방접종 일정 관리 불가 — 다음 접종일을 알 수 없어 알림 트리거 없음
2. 병원 예약 관리 불가 — 앱을 열 이유가 없음
3. 알림 발송 후 로그 없음 — 중복 발송 방지, 인앱 알림 목록 표시 불가
4. 멀티디바이스 푸시 알림 불가 — 토큰을 단일 컬럼으로 관리하면 기기 추가/제거 불가

---

## Decision

리텐션을 만드는 4개 도메인을 추가한다.

### 1. Vaccination (예방접종)

```
vaccinations
  id, pet_id
  name          — "광견병", "DHPPL" 등
  code          — 향후 표준화 코드 (현재 nullable)
  vaccinated_at — 접종일
  next_due_at   — 다음 접종 예정일 (알림 트리거)
  memo
```

MedicalEvent와 분리한 이유:

- MedicalEvent는 "갔다 온 기록" (과거)
- Vaccination은 "다음에 맞아야 할 날짜" (미래 + 주기 관리)

역할이 다르기 때문에 같은 테이블에 넣으면 조회/알림 로직이 복잡해진다.

`next_due_at`에 단독 인덱스를 만든 이유: 알림 스케줄러가 "이번 주 접종 예정인 반려동물 전체"를 조회할 때 pet_id 없이 날짜 범위 조건만으로 스캔하기 때문이다.

`code`는 현재 nullable이다. 사용자가 자유롭게 입력하는 초기에는 표준화하지 않고, 데이터가 쌓인 후 마스터 테이블로 분리하는 것을 검토한다.

### 2. Appointment (병원 예약)

```
appointments
  id, pet_id
  hospital_name
  scheduled_at  — 예약 일시 (알림 트리거)
  reason        — 정기검진, 예방접종, 증상 등 (자유 입력)
  status        — scheduled | completed | cancelled
  memo
```

Appointment와 MedicalEvent를 연결하지 않은 이유:

Appointment는 단순 달력 일정이다. 진료 완료 후 MedicalEvent를 자동 생성하면 두 도메인의 결합도가 높아지고 기획 변경 시 양쪽을 수정해야 한다. 사용자가 원하면 별도로 MedicalEvent를 입력하면 된다.

### 3. PushToken (FCM 토큰)

```
push_tokens
  id, user_id
  token   @unique
```

User 테이블에 `push_token: String?` 컬럼 하나를 두는 것이 가장 간단하다.

그러나 이 경우 멀티디바이스(폰 + 태블릿)를 지원하려면 스키마 변경이 필요하다.

1:N으로 분리하면:

- 기기별 토큰 등록/해제 독립적으로 가능
- `token @unique`로 중복 등록 방지
- 특정 기기만 로그아웃하는 기능 구현 가능

### 4. Notification (알림 로그)

```
notifications
  id, user_id
  type           — appointmentReminder | vaccinationDue | medicationReminder | weeklyCheckin
  title, body
  reference_id   — appointment.id | vaccination.id | medication.id
  reference_type — appointment | vaccination | medication
  sent_at        — 실제 발송 시각 (NULL이면 미발송 대기 상태)
  read_at        — 읽은 시각 (인앱 알림 뱃지용)
```

단순히 발송 로그만 저장하지 않고, 인앱 알림 목록(읽음/안읽음)으로 활용한다.

`reference_id`만 저장하면 어느 테이블의 ID인지 알 수 없다. `reference_type`을 함께 저장해 딥링크("예약 알림 클릭 → 해당 예약 상세 화면") 구현이 가능하게 한다.

`sent_at`이 NULL인 레코드는 발송 대기 상태를 나타낸다. 스케줄러가 이를 조회해 FCM 발송 후 `sent_at`을 채운다. 중복 발송 방지 로직을 별도 테이블 없이 이 컬럼으로 처리한다.

---

## 알림 발송 타이밍 전략

| 타입 | 기준 | 타이밍 |
|------|------|--------|
| appointmentReminder | scheduled_at | D-1 |
| vaccinationDue | next_due_at | D-7, D-1 |
| medicationReminder | start_date ~ end_date 기간 | 매일 |
| weeklyCheckin | 고정 | 매주 월요일 |

비즈니스 로직(언제 알릴지)을 스키마에 넣지 않고 스케줄러에서 관리한다. 타이밍 변경 시 스키마 마이그레이션 없이 코드만 수정하면 된다.

---

## Trade-off

추가된 4개 모델로 DB 테이블 수가 5개에서 10개로 늘었다.

각 모델이 Pet을 통해 User와 연결되는 구조이므로 데이터 접근 경로는 일관된다.

리텐션 없는 MVP는 의미가 없다. 알림이 없으면 사용자가 앱을 열 이유가 없고, 앱을 열지 않으면 기록도 없고, 기록이 없으면 AI 리포트도 없다.

---

## Status

스키마 설계 완료. 알림 발송 실행(스케줄러, FCM 연동)은 추후 구현.
