# Environment 설정 가이드

## 1. 개발 환경 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20.x 이상 |
| pnpm | 8.x 이상 |
| PostgreSQL | 15.x 이상 |
| Docker (선택) | 24.x 이상 |

---

## 2. 환경 변수

### Backend (.env)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/petlog

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# App
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 3. 로컬 개발 환경 세팅

### 1) 저장소 클론

```bash
git clone https://github.com/{username}/petlog.git
cd petlog
```

### 2) 패키지 설치

```bash
# Backend
cd backend
pnpm install

# Frontend
cd frontend
pnpm install
```

### 3) 환경 변수 설정

```bash
# Backend
cp .env.example .env
# .env 파일 수정

# Frontend
cp .env.example .env.local
# .env.local 파일 수정
```

### 4) Database 설정

```bash
# PostgreSQL 실행 (Docker 사용 시)
docker run -d \
  --name petlog-db \
  -e POSTGRES_USER=petlog \
  -e POSTGRES_PASSWORD=petlog \
  -e POSTGRES_DB=petlog \
  -p 5432:5432 \
  postgres:15

# Migration 실행
cd backend
pnpm migration:run
```

### 5) 개발 서버 실행

```bash
# Backend
cd backend
pnpm start:dev

# Frontend
cd frontend
pnpm dev
```

---

## 4. 환경별 설정

### development

- Mock AI 사용
- 로그 레벨: verbose
- CORS: localhost 허용

### production

- 실제 AI Provider 연동 (향후)
- 로그 레벨: error
- CORS: 도메인 제한

---

## 5. Database Migration 규칙

새로운 Schema 변경 시:

```bash
# Migration 생성
pnpm migration:generate -- -n MigrationName

# Migration 실행
pnpm migration:run

# Migration 롤백
pnpm migration:revert
```

운영 DB에 직접 수정하지 않는다.

반드시 Migration 파일로 관리한다.

---

## 6. 포트 정보

| 서비스 | 포트 |
|--------|------|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 3001 |
| PostgreSQL | 5432 |
