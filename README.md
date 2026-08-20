# Petlog

반려동물 보호자를 위한 건강 기록 관리 서비스.

병원 기록, 증상, 식사, 체중 등 반려동물의 건강 데이터를 한 곳에 기록하고, AI 기반 분석을 통해 건강 변화 흐름을 파악할 수 있도록 돕는 모바일 우선 웹 애플리케이션입니다.

실제 반려동물 보호자가 일상에서 사용하는 서비스를 목표로 합니다.

**웹**: [https://petlog.quest](https://petlog.quest)
**Android 앱**: [Google Play](https://play.google.com/store/apps/details?id=quest.petlog.app) (2026년 8월 출시)

---

## 해결하는 문제

- 병원 기록과 건강 정보가 여러 곳에 흩어져 있다
- 반려동물의 작은 건강 변화를 알아차리기 어렵다
- 병원 방문 후 설명 내용을 기억하기 어렵다
- 장기적인 건강 기록 관리가 어렵다

## 주요 기능

| 기능                 | 설명                                                   |
| -------------------- | ------------------------------------------------------ |
| 반려동물 프로필 관리 | 이름, 종, 품종, 성별, 체중 등 기본 정보 관리           |
| 건강 기록            | 체중, 식사, 활동량, 증상, 배변, 구토, 기분 일별 기록   |
| 병원 방문 기록       | 진료 내역, 병원명, 첨부파일 관리                       |
| 투약 관리            | 투약 이름, 용량, 투여 주기, 기간 관리                  |
| 예방접종 관리        | 접종 이력과 다음 접종 예정일 관리                      |
| 병원 예약            | 예약 일정 등록 및 다가오는 일정 확인                   |
| 건강 리포트          | 주간/월간 건강 변화 AI 요약 및 권고사항 제공           |
| 리포트 공유          | 공유 링크로 가족·수의사에게 리포트 전달 (OG 카드 포함) |
| 알림                 | 백신/투약/예약 등 푸시 알림, 알림 설정 관리            |

---

## 기술 스택

### Frontend

- **Next.js** + **React** + **TypeScript**
- 모바일 우선 반응형 UI

### Mobile

- **Capacitor** (Android) — 배포된 웹앱을 원격 URL 모드로 감싼 네이티브 셸 (`mobile/`)
- 푸시 알림(FCM), 네이티브 스플래시/상태바

### Backend

- **NestJS** + **TypeScript**
- **GraphQL** (Apollo Server) 중심 API — 파일 업로드, 인증 쿠키, 공유 리포트 OG 응답처럼
  GraphQL에 맞지 않는 소수 엔드포인트만 REST Controller로 유지
- **Prisma** ORM

### Database

- **PostgreSQL** (배포 환경은 AWS RDS)

### AI

- **OpenAI Fine-tuned 모델**(`gpt-4o-mini` 기반, 반려동물 건강 데이터로 파인튜닝) 연동 완료 — 실제 건강 리포트 생성에 사용
- Mock AI Service는 개발/테스트 환경용으로 유지 (교체 가능한 Provider 추상화 구조)

### 공유 모듈 (`libs/`)

- 외부 서비스 어댑터(`ai`, `mail`, `push`, `firebase`, `storage`)와 개발용 시드 데이터(`seed`)
- 도메인 타입은 GraphQL codegen이 생성하므로 별도 공유 타입 패키지를 두지 않는다

### 운영

- **Sentry** — 프론트/백엔드 에러 및 트레이스 수집

### Infrastructure

- **AWS** (ECS Fargate + ALB + CloudFront + RDS PostgreSQL + S3)
- **CDKTF** (TypeScript 기반 IaC, `infra/`)
- 커스텀 도메인 **petlog.quest** — 프론트엔드/백엔드(`/api/*`)가 같은 CloudFront 배포를 공유

---

## 프로젝트 구조

```
petlog/
├── frontend/          # Next.js 앱
├── backend/           # NestJS 앱
├── mobile/            # Capacitor Android 셸 (Play Store 배포)
├── libs/
│   ├── ai/            # AI Provider 추상화 (OpenAI / Mock)
│   ├── mail/          # 메일 발송 (AWS SES)
│   ├── push/          # 푸시 발송
│   ├── firebase/      # FCM 연동
│   ├── storage/       # 이미지 스토리지 (S3)
│   └── seed/          # 개발용 시드 데이터
├── infra/             # CDKTF 인프라 코드
├── tsconfig.base.json
└── tsconfig.json
```

### 도메인 모델

```
User
 └── Pet
      ├── HealthRecord    (체중, 식사, 활동량, 증상 등)
      ├── MedicalEvent    (병원 방문 기록)
      ├── Medication      (투약 정보)
      ├── Vaccination     (예방접종 이력)
      ├── Appointment     (병원 예약)
      └── Report          (주간/월간 AI 건강 리포트)
           └── ReportShare (공유 링크)
```

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- pnpm (또는 npm)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/petlog.git
cd petlog

# 의존성 설치
pnpm install

# 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 데이터베이스 마이그레이션
cd backend && pnpm migration:run

# 백엔드 실행 (포트 3001)
cd backend && pnpm dev

# 프론트엔드 실행 (포트 3000)
cd frontend && pnpm dev
```

### Android 앱 실행

```bash
cp mobile/.env.example mobile/.env   # MOBILE_APP_URL 확인
npm run run:android --workspace=mobile
```

자세한 내용(릴리즈 AAB 빌드, 서명, 에뮬레이터 주의사항)은 [`mobile/README.md`](mobile/README.md) 참고.

---

## AI 아키텍처

AI 기능은 교체 가능한 구조로 설계되어 있습니다.

```
HealthReportGenerator (interface)
 ├── LlmHealthReportGenerator     ← 실제 서비스 (OpenAI Fine-tuned 모델)
 └── MockHealthReportGenerator    ← 개발/테스트 환경 (OPENAI_API_KEY 미설정 시 자동 선택)
```

어떤 구현체를 쓸지는 `AiModule`의 Provider 팩토리 한 곳에서만 결정하며, `ReportService`는
`HealthReportGenerator` 인터페이스만 알기 때문에 비즈니스 로직 변경 없이 Provider를 교체할 수 있습니다.

---

## 설계 원칙

- **Domain First** — 화면이나 기술 기준이 아닌 비즈니스 도메인 기준으로 설계
- **Separation of Concerns** — UI, 비즈니스 로직, 데이터 접근, AI 서비스 책임 분리
- **Mobile First** — 빠른 기록, 적은 입력, 명확한 정보 표현 우선
- **Testable Architecture** — Mock 교체 가능한 추상화로 테스트 가능한 구조 유지

---

## 테스트 전략

계층마다 잡아내는 버그의 종류가 다르다는 전제로, 한 계층에 몰아넣지 않고 나눠서 쌓았습니다.

| 계층                 | 도구             | 대상                                                                      | 실행 시점    |
| -------------------- | ---------------- | ------------------------------------------------------------------------- | ------------ |
| Backend 유닛테스트   | Jest             | 핵심 비즈니스 로직 (리포트 생성 정책, 건강 기록 검증, 인증/토큰 로테이션) | PR마다       |
| E2E                  | Playwright       | 인증 흐름 (httpOnly 쿠키는 Mock으로 재현 불가능해 실제 백엔드+DB 필요)    | main push 시 |
| Frontend 유닛테스트  | Vitest           | 순수 함수 (날짜 계산, 리포트 기간, 홈 파생값, 이미지 압축)                | PR마다       |
| Frontend Integration | Playwright + MSW | 나머지 화면 흐름 (홈, 반려동물, 기록, 리포트, 테마)                       | PR마다       |

**왜 E2E만으로는 부족한가** — E2E는 실제로 화면 흐름 버그(Playwright strict-mode locator 충돌,
신규 가입 시 온보딩 오버레이가 클릭을 가로막는 문제)를 잡아냈지만, "달력 날짜와 시각을 혼동해
정상적인 날짜 선택이 거부되는" 것 같은 정책 로직 버그는 인증 흐름 E2E 4개 시나리오가 지나가지
않는 지점이라 전혀 잡지 못합니다. 그래서 리포트 생성 정책·건강 기록 검증처럼 이미 한 번 실제로
버그가 났던 로직부터 유닛테스트로 회귀를 막았습니다. 판단 근거는
[`013-e2e-vs-frontend-integration-test.md`](.claude/docs/decisions/013-e2e-vs-frontend-integration-test.md),
[`024-backend-unit-test-necessity.md`](.claude/docs/decisions/024-backend-unit-test-necessity.md)에
정리했습니다.

**E2E를 CI에 연동하며 실제로 잡은 버그들** — 로컬에서 통과한 뒤에도 CI에서만 재현되는 문제가
여러 라운드에 걸쳐 나왔고, 그때마다 원인을 추적해 고쳤습니다.

- 워크스페이스 공유 라이브러리(`libs/*`)를 먼저 빌드하지 않아 backend 빌드가 `TS6305`로 실패
- `npm ci --ignore-scripts`가 `bcrypt` 네이티브 바인딩 설치까지 건너뛰어 서버가 `MODULE_NOT_FOUND`로 죽음
- CI job의 환경변수(`PORT`)가 의도치 않게 다른 프로세스에 상속되어 포트 충돌
- `nest build`가 `tsconfig.build.json` 부재로 테스트 파일까지 프로덕션 빌드에 포함

---

## 개발 로드맵

- [x] 도메인 모델 정의
- [x] 공유 타입 및 유틸리티 (`libs/`)
- [x] PostgreSQL 스키마 및 마이그레이션
- [x] NestJS API 구현
- [x] Next.js 사용자 플로우
- [x] 건강 타임라인 UI
- [x] Mock AI 리포트 생성
- [x] 배포 (AWS ECS Fargate + ALB, CDKTF로 관리 — Vercel/Railway 대체, 커스텀 도메인 petlog.quest 연결)
- [x] 실제 AI 연동 (OpenAI Fine-tuned 모델)
- [x] Backend 유닛테스트 + 인증 E2E (Jest/Playwright, CI 연동)
- [x] Frontend 유닛/Integration 테스트 (Vitest, Playwright + MSW)
- [x] 푸시 알림 (FCM) 및 알림 설정
- [x] Android 앱 Google Play 출시 (Capacitor)
- [ ] 사용 지표 계측 및 리텐션 개선

---

## 라이선스

MIT
