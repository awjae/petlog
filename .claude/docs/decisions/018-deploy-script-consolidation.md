# Decision: 배포 스크립트 단순화 — `deploy:all` 하나로 통합, 계정 ID 하드코딩 제거

## Status

결정 및 구현 완료 (`infra/scripts/deploy.sh`, `infra/package.json`, `backend`/`frontend`의
`deploy:ecr-login`/`deploy:ecr-push`).

---

## Context

`infra/`는 CDKTF 스택 7개(`bootstrap`, `registry`, `storage`, `network`, `database`, `backend`,
`frontend`)로 구성돼 있고, 각 스택을 `PETLOG_ENV=dev npx cdktf diff/deploy petlog-<stack>-dev`
형태로 하나씩 순서를 기억해서 수동 실행해야 했다(`infra/README.md`의 기존 "스택별 세부 절차").
게다가 App Runner는 ECR에 이미지가 있어야만 서비스를 만들 수 있어서, 맨 처음 배포할 때는 스택
배포와 Docker 이미지 빌드/push가 정해진 순서로 맞물려야 하는 "최초 배포 전 수동 절차"가 별도로
있었다 — 스택이 늘어날수록 사람이 순서를 외워야 하는 부담이 커졌다.

별개로, ECR 로그인/push에 필요한 AWS 계정 ID(`095256592046`)가 `infra/config.ts`의 주석과
`backend`/`frontend`의 `package.json` 스크립트 여러 곳에 각각 하드코딩돼 있었다. 계정을 옮기거나
새 환경을 추가할 때마다 이 값을 여러 파일에서 찾아 고쳐야 하는 구조였다.

---

## Problem

1. 인프라 배포 절차가 스택 개수만큼 늘어나는 수동 명령으로 흩어져 있어, "무엇이 바뀌었는지"와
   무관하게 매번 전체 순서를 다시 따라가야 했다.
2. "최초 배포"와 "이후 변경 반영"이 서로 다른 절차(수동 이미지 빌드/push 포함 여부)로 문서화돼
   있어, 실수로 순서를 건너뛰기 쉬웠다.
3. AWS 계정 ID가 여러 파일에 중복 하드코딩돼 있어 단일 정보 소스가 없었다.

---

## Decision

### `infra`: `deploy:all` 하나로 upsert

`infra/scripts/deploy.sh`(`npm run deploy:all`)가 `bootstrap`을 제외한 6개 스택을 다음 순서로
처리한다.

1. `registry`/`storage`/`network`/`database` 스택 배포
2. ECR 로그인 → **backend 이미지가 없을 때만**(최초 배포) 레포 루트를 컨텍스트로 빌드/push
3. `backend-stack` 1차 배포 (`frontend_url` 기본값 `''`)
4. **frontend 이미지가 없을 때만**(최초 배포) backend URL을 `--build-arg`로 주입해 빌드/push
5. `frontend-stack` 배포
6. `backend-stack` 2차 배포 (`TF_VAR_frontend_url` 채워 CORS 반영)

`cdktf deploy`(terraform apply) 자체가 이미 upsert(없으면 생성, 있으면 변경분만 반영)이므로,
이 스크립트는 **최초 배포와 이후 변경 반영을 구분하지 않는다** — 유일한 예외인 "ECR 이미지 부재"만
이미지 존재 여부 체크로 흡수했다. 기존에 있던 스택별 `diff:<stack>`/`deploy:<stack>` 개별 스크립트
(`diff:registry`, `deploy:registry`, ... `deploy:backend:with-frontend-url` 등)는 전부 제거했다.

### `backend`/`frontend`: 계정 ID 하드코딩 제거

`deploy:ecr-login`/`deploy:ecr-push`가 `aws sts get-caller-identity`로 계정 ID를 매번 동적으로 조회하도록
바꿨다. 리전/환경(`AWS_REGION`/`PETLOG_ENV`)만 각 워크스페이스의 로컬 env 파일로 관리한다
(`backend/.env`, `frontend/.env.local` — 각각 `.env.example`/`.env.local.example`에 기본값 문서화,
기본값은 `ap-northeast-2`/`dev`). 루트에 있던 `ecr:login` 스크립트는 제거하고, 그 로그인 로직을
`backend`/`frontend`의 `deploy:ecr-login`으로 각각 이전해 각 워크스페이스가 자기 배포에 필요한 걸
스스로 해결하도록(self-contained) 만들었다.

**[갱신]** `frontend/.env.local`은 `next dev`/`build`/`start`가 항상 자동으로 읽는 파일이라, 여기에
실제 AWS 자격 증명·Sentry DSN을 두면 로컬 개발 서버에도 그 값이 로드되는 문제가 있었다. 그래서
배포 스크립트(`deploy:check-version`/`ecr-login`/`ecr-push`/`ecs-force-redeploy`)가 읽는 시크릿 값은
`frontend/.env.deploy`(gitignore, `frontend/.env.deploy.example`로 템플릿 문서화)로 분리하고,
`frontend/.env.local`에는 `AWS_REGION`/`PETLOG_ENV`처럼 시크릿이 아닌 로컬 실행용 값만 남긴다.
`backend/.env`는 이 분리 대상이 아니다(백엔드는 로컬 실행과 배포가 같은 값을 공유해도 문제없음).

---

## Reason

### terraform apply는 원래 upsert다

"최초 배포"와 "재배포"를 별도 절차로 문서화한 것 자체가 잘못된 정신 모델이었다. 실제로 다른 건
"ECR에 이미지가 있는지"뿐이므로, 그 하나의 조건만 스크립트가 확인하면 나머지는 항상 같은 경로를
타도 된다.

### 계정 ID는 이미 자격증명이 갖고 있는 정보다

AWS 프로필/자격증명 자체가 "어떤 계정인지"를 이미 알고 있으므로, 그 값을 별도 파일에 복제해두는
것은 동기화 리스크만 만드는 중복이다. `aws sts get-caller-identity`로 실행 시점에 조회하면 계정을
이전해도 고칠 파일이 없다.

### 워크스페이스는 자기 배포를 스스로 완결해야 한다

루트에 있던 `ecr:login`은 `backend`/`frontend`의 `deploy:ecr-push`가 로그인을 스스로 못해서 생긴
임시방편이었다. 로그인을 각 워크스페이스로 이전하면 `npm run deploy --workspace=backend` 한
번으로 로그인부터 push까지 끝난다 — "인프라 구조가 바뀌면 `infra`에서, 애플리케이션 코드만
바뀌면 `backend`/`frontend`에서"라는 책임 분리와 맞아떨어진다.

---

## Trade-off

### `infra`가 Docker 빌드를 알게 되는 경계 침범 (의도적 타협)

원래는 "infra는 CDKTF 스택만, backend/frontend는 이미지만"으로 역할을 나누려 했지만, App Runner가
이미지 없이는 뜰 수 없다는 제약 때문에 `deploy.sh`가 최초 배포 한정으로 Docker build/push를
직접 수행한다. 이 경계 침범은 최초 배포 시에만 발동하고(이미지가 있으면 건드리지 않음), 나머지
경우엔 여전히 `backend`/`frontend`가 이미지 교체를 전담한다.

### backend-stack이 매번 2번 배포됨

`deploy:all`은 frontend URL 변경 여부와 무관하게 매번 backend-stack을 2차 배포한다. 대부분의
경우 URL이 안 바뀌어 apply가 no-op이지만, 불필요한 `cdktf deploy` 한 번이 항상 추가된다.

### `dev` 환경 전용

`diff:all`/`deploy:all`은 `dotenv -v PETLOG_ENV=dev`로 값을 고정 호출하므로, 셸에서
`PETLOG_ENV=prod`를 설정해도 무시된다. `prod` 도입 시 별도 스크립트 추가나 `deploy.sh`
파라미터화가 필요하다.

### 매 배포/push마다 STS 호출 1회 추가

계정 ID를 매번 조회하므로 `aws sts get-caller-identity` API 호출이 늘었다 — 지연은 미미하지만,
AWS 자격증명이 항상 유효해야 한다는 전제가 (기존에도 필요했지만) 더 여러 지점에서 드러난다.

---

## 관련 문서

- `infra/README.md` — 실제 사용법과 스크립트 동작 상세
- `infra/scripts/deploy.sh` — 구현
