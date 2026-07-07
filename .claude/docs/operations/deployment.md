# Deployment 가이드

## 1. 배포 환경

| 항목 | 서비스 |
|------|--------|
| Frontend | AWS ECS Fargate (`petlog-frontend-{env}`), 공유 ALB의 frontend 타겟 그룹에 등록 |
| Backend | AWS ECS Fargate (`petlog-backend-{env}`), 공유 ALB의 backend 타겟 그룹에 등록 (`/api/*`) |
| Load Balancer | AWS ALB (`petlog-alb-{env}`, backend-stack이 생성, backend/frontend 공유, HTTP 80만) |
| Database | AWS RDS PostgreSQL (`petlog-db-{env}`, `db.t4g.micro`, Single-AZ. Railway managed DB 완전 대체, `infra/README.md` 참고) |
| Container Registry | AWS ECR (`petlog-backend-{env}`, `petlog-frontend-{env}`) |
| IaC | CDKTF (TypeScript, `infra/`) |

> Vercel(Frontend)/Railway(Backend/Database)는 ECS Fargate+ALB/RDS로 완전히 대체했다. 원래는
> App Runner로 구현했으나, App Runner가 서울 리전(ap-northeast-2)을 지원하지 않는다는 사실을
> DNS/CLI로 직접 확인해 ECS Fargate + ALB로 전환했다. 인프라 정의는 코드로만 관리하며(`infra/`),
> 콘솔에서 수동으로 리소스를 만들지 않는다. 상세 스택 구조와 배포 절차는 `infra/README.md`를
> 단일 출처로 삼는다 — 이 문서는 배포 원칙과 체크리스트만 다룬다. **로컬 개발 환경은 이 전환과
> 무관하게 그대로다** — `docker-compose.yml`의 로컬 Postgres를 계속 사용한다.

---

## 2. 배포 원칙

- main 브랜치에 머지된 코드만 배포한다
- 환경 변수/시크릿은 AWS SSM Parameter Store(SecureString)로 관리한다 (`infra/stacks/backend-stack.ts`)
- DB Migration은 배포 전 반드시 검증한다
- 롤백 가능한 상태를 유지한다 (ECS는 이전 태스크 정의 리비전으로 즉시 롤백 가능)
- 인프라 변경(`cdktf deploy`)은 자동화하지 않는다 — 항상 수동 승인 후 실행한다

---

## 3. Frontend 배포 (AWS ECS Fargate)

### 설정

`infra/stacks/frontend-stack.ts`가 관리하는 ECS 태스크 정의의 환경변수(빌드 인자 포함):

```
NEXT_PUBLIC_API_URL=http://<backend-stack의 alb_url>   # Docker 빌드 시점 --build-arg, 런타임 아님
NODE_ENV=production
```

`NEXT_PUBLIC_API_URL`은 backend/frontend가 공유하는 ALB의 URL이다 — CDKTF cross-stack
reference로 backend-stack의 `alb_url` 출력값을 그대로 참조하므로 수동으로 조회해 채울 필요가
없다(`infra/README.md`의 "ALB 공유로 순환 의존이 사라진 이유" 참고).

### 배포 흐름

```
Docker 이미지 빌드(--build-arg NEXT_PUBLIC_API_URL) → ECR(petlog-frontend-{env})에 push
↓
aws ecs update-service --force-new-deployment (npm run deploy --workspace=frontend에 포함)
```

App Runner와 달리 ECS는 ECR에 새 `latest` 이미지를 push해도 자동으로 재배포하지 않는다 —
`frontend/package.json`의 `deploy:image`가 push 직후 `deploy:ecs-force-redeploy`
(`aws ecs update-service --force-new-deployment`)를 함께 실행해 최신 이미지로 태스크를
다시 띄운다.

인프라 스택 구조(ALB/타겟 그룹/태스크 정의 사양 자체)는 건드리지 않고 코드만 바뀐 경우, `frontend`
워크스페이스에서 이미지 빌드/push/재배포만 실행하면 된다 — 인프라 배포(`cdktf deploy`)는 필요 없다.

```bash
NEXT_PUBLIC_API_URL="http://<backend-stack의 alb_url>" npm run deploy --workspace=frontend
```

CI/CD로 이 과정을 자동화하는 것은 아직 범위 밖이며, 현재는 로컬에서 위 커맨드를 수동으로
실행한다. 최초 배포(ECR에 이미지가 아직 없는 상태)는 `infra/README.md`의 배포 절차를 따른다.

---

## 4. Backend 배포 (AWS ECS Fargate)

### 환경 변수 설정

`infra/stacks/backend-stack.ts`가 관리하는 ECS 태스크 정의의 환경변수/시크릿:

```
# 일반 환경변수
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=<storage-stack cross-stack reference>
AWS_CLOUDFRONT_DOMAIN=<storage-stack cross-stack reference>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
NODE_ENV=production
FRONTEND_URL=<backend-stack 자신이 만든 alb_url — backend/frontend가 공유하는 도메인>

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
aws ecs update-service --force-new-deployment (npm run deploy --workspace=backend에 포함)
↓
(DB Migration은 별도 실행 — ECS 태스크 시작 커맨드에 포함하지 않는다)
```

인프라 스택 구조는 그대로 두고 코드만 바뀐 경우, `backend` 워크스페이스에서 이미지 빌드/push/
재배포만 실행한다 — 인프라 배포(`cdktf deploy`)는 필요 없다.

```bash
npm run deploy --workspace=backend
```

ALB/타겟 그룹/ECS 클러스터/태스크 사양 등 인프라 스택 자체가 바뀔 때만
`infra/README.md`의 `npm run deploy:all --workspace=infra` 절차를 따른다 (최초 배포와 이후 변경
반영 모두 이 명령 하나로 처리된다 — `infra/scripts/deploy.sh`가 ECR 이미지 존재 여부를 감지해
upsert 방식으로 동작한다).

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

Migration 전 DB 백업을 생성한다. RDS는 `backupRetentionPeriod: 1`(1일, 프리티어 계정의 백업
보관 상한 제약)로 자동 백업을 설정해뒀고(`infra/stacks/database-stack.ts`), 필요 시 수동
스냅샷도 추가로 생성할 수 있다. Railway → RDS 이전 자체는 완료됐으며, 이전 시 사용한 백업/롤백
절차는 `infra/README.md`를 참고한다.

---

## 6. 배포 체크리스트

배포 전:

- 환경 변수/SSM 시크릿이 모두 채워져 있는가?
- ECR에 최신 이미지가 push되어 있는가?
- Migration 파일이 올바른가?
- 빌드가 로컬에서 성공하는가?
- 주요 API 엔드포인트가 동작하는가?

배포 후:

- Health Check: ALB 타겟 그룹 상태가 healthy인가? (backend `/api/health`, frontend `/` —
  frontend 타겟 그룹 헬스체크는 `/api/health`가 아니라 `/`다. ALB가 `/api/*`를 항상 backend로
  라우팅하므로 frontend 타겟 그룹에서는 그 경로에 도달할 수 없기 때문이다.)
- ECS 서비스의 태스크가 `RUNNING` 상태이고 재시작을 반복하지 않는가?
- CloudWatch Logs(`/ecs/petlog-backend-{env}`, `/ecs/petlog-frontend-{env}`)에 에러가 없는가?
- 핵심 사용자 흐름이 동작하는가?

---

## 7. 롤백 절차

문제 발생 시:

1. ECS 콘솔/CLI에서 이전 태스크 정의 리비전으로 서비스를 되돌린다
   (`aws ecs update-service --task-definition <이전 리비전 ARN>`)
2. DB Migration이 있었다면 revert 실행
3. 원인 분석 후 수정 배포

---

## 8. 모니터링

현재:

- ECS/CloudWatch Logs (`/ecs/petlog-backend-{env}`, `/ecs/petlog-frontend-{env}`, 보관 기간 7일)
- ALB 타겟 그룹 헬스체크 상태

향후:

- 에러 트래킹 (Sentry)
- 성능 모니터링
- 알림 설정
