---
description: Petlog 개발 서버를 실행한다
---

실행 대상: $ARGUMENTS
(frontend / backend / all 중 지정, 미지정 시 all)

---

## 실행 방법

### Frontend (Next.js)
```bash
cd /Users/jason/Documents/vscode/petlog/frontend
npm run dev
```
- 기본 포트: http://localhost:3000
- 모바일 확인: 브라우저 개발자 도구 → 모바일 뷰 (iPhone 14 기준)

### Backend (NestJS)
```bash
cd /Users/jason/Documents/vscode/petlog/backend
npm run start:dev
```
- 기본 포트: http://localhost:4000
- API 문서: http://localhost:4000/api (Swagger 설정 시)

---

## 실행 후 확인 항목

1. 서버가 정상 시작되었는가? (에러 없이 "Listening on port" 메시지)
2. Frontend가 Backend에 연결되는가? (환경 변수 `NEXT_PUBLIC_API_URL` 확인)
3. DB 연결이 정상인가? (NestJS 시작 시 TypeORM/Prisma 연결 로그 확인)

---

## 실행이 실패하는 경우

- **포트 충돌**: `lsof -i :3000` 또는 `lsof -i :4000`으로 기존 프로세스 확인
- **패키지 없음**: `npm install` 먼저 실행
- **DB 연결 실패**: `.env` 파일의 `DATABASE_URL` 확인
- **TypeScript 에러**: `npm run build`로 빌드 에러 먼저 확인

실행 후 핵심 사용자 흐름(회원가입 → 반려동물 등록 → 건강 기록 작성)이 정상 동작하는지 확인한다.
