# Deployment 가이드

## 1. 배포 환경

| 항목 | 서비스 |
|------|--------|
| Frontend | Vercel |
| Backend | Railway 또는 Fly.io |
| Database | Supabase 또는 Railway PostgreSQL |

---

## 2. 배포 원칙

- main 브랜치에 머지된 코드만 배포한다
- 환경 변수는 배포 플랫폼의 시크릿 관리 기능을 사용한다
- DB Migration은 배포 전 반드시 검증한다
- 롤백 가능한 상태를 유지한다

---

## 3. Frontend 배포 (Vercel)

### 설정

Vercel 프로젝트 설정에서 환경 변수를 추가한다.

```
NEXT_PUBLIC_API_URL=https://api.petlog.app
```

### 배포 흐름

```
GitHub main 브랜치 머지
↓
Vercel 자동 빌드
↓
Preview 확인
↓
Production 자동 배포
```

### 빌드 커맨드

```bash
pnpm build
```

---

## 4. Backend 배포 (Railway)

### 환경 변수 설정

Railway 대시보드에서 다음 환경 변수를 설정한다.

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
```

### 배포 흐름

```
GitHub main 브랜치 머지
↓
Railway 자동 빌드
↓
Migration 실행
↓
서버 재시작
```

### 시작 커맨드

```bash
pnpm migration:run && pnpm start:prod
```

---

## 5. Database 배포

### Migration 전략

배포 전 반드시 Migration 파일을 검증한다.

순서:

1. 스테이징 환경에서 Migration 실행 확인
2. 기존 데이터 영향 여부 확인
3. 롤백 Migration 준비
4. Production Migration 실행

### 데이터 백업

Migration 전 DB 백업을 생성한다.

---

## 6. 배포 체크리스트

배포 전:

- 환경 변수가 모두 설정되어 있는가?
- Migration 파일이 올바른가?
- 빌드가 로컬에서 성공하는가?
- 주요 API 엔드포인트가 동작하는가?

배포 후:

- Health Check 엔드포인트가 응답하는가?
- 로그에 에러가 없는가?
- 핵심 사용자 흐름이 동작하는가?

---

## 7. 롤백 절차

문제 발생 시:

1. 이전 배포 버전으로 즉시 롤백
2. DB Migration이 있었다면 revert 실행
3. 원인 분석 후 수정 배포

---

## 8. 모니터링

현재:

- Railway / Vercel 기본 로그 모니터링

향후:

- 에러 트래킹 (Sentry)
- 성능 모니터링
- 알림 설정
