# Petlog

반려동물 보호자를 위한 건강 기록 관리 서비스.

병원 기록, 증상, 식욕, 체중 등 반려동물의 건강 데이터를 한 곳에 기록하고, AI 기반 분석을 통해 건강 변화 흐름을 파악할 수 있도록 돕는 모바일 우선 웹 애플리케이션입니다.

> **포트폴리오 프로젝트** — 풀스택/프로덕트 엔지니어 역량을 보여주기 위한 목적으로 설계되었습니다.

---

## 해결하는 문제

- 병원 기록과 건강 정보가 여러 곳에 흩어져 있다
- 반려동물의 작은 건강 변화를 알아차리기 어렵다
- 병원 방문 후 설명 내용을 기억하기 어렵다
- 장기적인 건강 기록 관리가 어렵다

## 주요 기능

| 기능 | 설명 |
|------|------|
| 반려동물 프로필 관리 | 이름, 종, 품종, 성별, 체중 등 기본 정보 관리 |
| 건강 기록 | 체중, 식욕, 활동량, 증상, 배변, 구토, 기분 일별 기록 |
| 병원 방문 기록 | 진료 내역, 병원명, 첨부파일 관리 |
| 투약 관리 | 투약 이름, 용량, 투여 주기, 기간 관리 |
| 건강 리포트 | 주간/월간 건강 변화 AI 요약 및 권고사항 제공 |

---

## 기술 스택

### Frontend
- **Next.js** + **React** + **TypeScript**
- 모바일 우선 반응형 UI

### Backend
- **NestJS** + **TypeScript**
- RESTful API

### Database
- **PostgreSQL**

### AI
- 현재: Mock AI Service
- 향후: LLM API 연동 (교체 가능한 추상화 구조)

### 공유 모듈 (`libs/`)
- 프론트엔드/백엔드 공통 타입, 유틸, 시드 데이터

---

## 프로젝트 구조

```
petlog/
├── frontend/          # Next.js 앱
├── backend/           # NestJS 앱
├── libs/
│   ├── types/         # 공유 도메인 타입 (Pet, HealthRecord, Report 등)
│   ├── utils/         # 공유 유틸리티 함수
│   └── seed/          # 개발용 시드 데이터
├── infra/             # 인프라 설정
├── tsconfig.base.json
└── tsconfig.json
```

### 도메인 모델

```
User
 └── Pet
      ├── HealthRecord    (체중, 식욕, 활동량, 증상 등)
      ├── MedicalEvent    (병원 방문 기록)
      ├── Medication      (투약 정보)
      └── Report          (주간/월간 AI 건강 리포트)
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

---

## AI 아키텍처

AI 기능은 교체 가능한 구조로 설계되어 있습니다.

```
HealthReportGenerator (interface)
 ├── MockHealthReportGenerator  ← 현재 사용
 └── LLMHealthReportGenerator   ← 향후 연동
```

Mock → 실제 LLM 전환 시 비즈니스 로직 변경 없이 Provider만 교체합니다.

---

## 설계 원칙

- **Domain First** — 화면이나 기술 기준이 아닌 비즈니스 도메인 기준으로 설계
- **Separation of Concerns** — UI, 비즈니스 로직, 데이터 접근, AI 서비스 책임 분리
- **Mobile First** — 빠른 기록, 적은 입력, 명확한 정보 표현 우선
- **Testable Architecture** — Mock 교체 가능한 추상화로 테스트 가능한 구조 유지

---

## 개발 로드맵

- [x] 도메인 모델 정의
- [x] 공유 타입 및 유틸리티 (`libs/`)
- [ ] PostgreSQL 스키마 및 마이그레이션
- [ ] NestJS API 구현
- [ ] Next.js 사용자 플로우
- [ ] 건강 타임라인 UI
- [ ] Mock AI 리포트 생성
- [ ] 배포 (Vercel + Railway)
- [ ] 실제 LLM 연동

---

## 라이선스

MIT
