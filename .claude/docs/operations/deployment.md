# Deployment 가이드

## 1. 배포 환경

| 항목 | 서비스 |
|------|--------|
| Frontend | AWS App Runner (`petlog-frontend-{env}`) |
| Backend | AWS App Runner (`petlog-backend-{env}`) |
| Database | AWS RDS PostgreSQL (`petlog-db-{env}`, `db.t4g.micro`, Single-AZ. Railway managed DB 완전 대체, `infra/README.md` 참고) |
| Container Registry | AWS ECR (`petlog-backend-{env}`, `petlog-frontend-{env}`) |
| IaC | CDKTF (TypeScript, `infra/`) |

> Vercel(Frontend)/Railway(Backend/Database)는 App Runner/RDS로 완전히 대체했다. 인프라 정의는
> 코드로만 관리하며(`infra/`), 콘솔에서 수동으로 리소스를 만들지 않는다. 상세 스택 구조와 배포
> 절차는 `infra/README.md`를 단일 출처로 삼는다 — 이 문서는 배포 원칙과 체크리스트만 다룬다.
> **로컬 개발 환경은 이 전환과 무관하게 그대로다** — `docker-compose.yml`의 로컬 Postgres를
> 계속 사용한다.

---

## 2. 배포 원칙

- main 브랜치에 머지된 코드만 배포한다
- 환경 변수/시크릿은 AWS SSM Parameter Store(SecureString)로 관리한다 (`infra/stacks/backend-stack.ts`)
- DB Migration은 배포 전 반드시 검증한다
- 롤백 가능한 상태를 유지한다 (App Runner는 이전 배포로 즉시 롤백 가능)
- 인프라 변경(`cdktf deploy`)은 자동화하지 않는다 — 항상 수동 승인 후 실행한다

---

## 3. Frontend 배포 (AWS App Runner)

### 설정

`infra/stacks/frontend-stack.ts`가 관리하는 App Runner 서비스의 환경변수:

```
NEXT_PUBLIC_API_URL=https://<backend-stack의 App Runner 서비스 URL>
NODE_ENV=production
```

`NEXT_PUBLIC_API_URL`은 CDKTF cross-stack reference로 backend-stack의 출력값을 직접
참조하므로 수동으로 채울 필요가 없다.

### 배포 흐름

```
Docker 이미지 빌드 → ECR(petlog-frontend-{env})에 push
↓
App Runner 자동 재배포 (auto_deployments_enabled)
```

CI/CD로 이미지 빌드/푸시를 자동화하는 것은 아직 범위 밖이며, 현재는 수동 절차다
(`infra/README.md`의 "최초 배포 전 수동 절차" 참고).

### 빌드 커맨드

```bash
docker build -t petlog-frontend .
```

---

## 4. Backend 배포 (AWS App Runner)

### 환경 변수 설정

`infra/stacks/backend-stack.ts`가 관리하는 App Runner 서비스의 환경변수/시크릿:

```
# 일반 환경변수
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=<storage-stack cross-stack reference>
AWS_CLOUDFRONT_DOMAIN=<storage-stack cross-stack reference>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
NODE_ENV=production
FRONTEND_URL=<frontend-stack 배포 후 2차 배포로 채움>

# 시크릿 (SSM Parameter Store SecureString)
DATABASE_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
```

시크릿 실제 값은 코드에 없다. `DATABASE_URL`은 완성된 문자열을 변수로 받는 대신, RDS 마스터
비밀번호(AWS 관리형 — `database-stack`이 `manageMasterUserPassword: true`로 생성, Secrets
Manager에 저장)와 `database-stack`의 RDS 엔드포인트(cross-stack reference)를 조합해
`backend-stack` 코드 안에서 직접 조립한다. 배포 시 `TF_VAR_jwt_secret`,
`TF_VAR_refresh_token_secret` 환경변수만 주입하면 된다 (`infra/README.md`의 "백엔드 시크릿 채우기" 절 참고).

### 배포 흐름

```
Docker 이미지 빌드 → ECR(petlog-backend-{env})에 push
↓
App Runner 자동 재배포 (auto_deployments_enabled)
↓
(DB Migration은 별도 실행 — App Runner 시작 커맨드에 포함하지 않는다)
```

### 시작 커맨드

```bash
pnpm start:prod
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

Migration 전 DB 백업을 생성한다. RDS는 `backupRetentionPeriod: 7`(7일)로 자동 백업을 설정해뒀고
(`infra/stacks/database-stack.ts`), 필요 시 수동 스냅샷도 추가로 생성할 수 있다. Railway → RDS
이전 자체는 완료됐으며, 이전 시 사용한 백업/롤백 절차는 `infra/README.md`를 참고한다.

---

## 6. 배포 체크리스트

배포 전:

- 환경 변수/SSM 시크릿이 모두 채워져 있는가?
- ECR에 최신 이미지가 push되어 있는가?
- Migration 파일이 올바른가?
- 빌드가 로컬에서 성공하는가?
- 주요 API 엔드포인트가 동작하는가?

배포 후:

- Health Check 엔드포인트(`/api/health`, 백엔드 4000 / 프론트엔드 3000)가 응답하는가?
- App Runner 로그(CloudWatch)에 에러가 없는가?
- 핵심 사용자 흐름이 동작하는가?

---

## 7. 롤백 절차

문제 발생 시:

1. App Runner 콘솔/CLI에서 이전 배포로 즉시 롤백
2. DB Migration이 있었다면 revert 실행
3. 원인 분석 후 수정 배포

---

## 8. 모니터링

현재:

- App Runner 기본 로그(CloudWatch Logs)

향후:

- 에러 트래킹 (Sentry)
- 성능 모니터링
- 알림 설정
