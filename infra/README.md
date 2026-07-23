# Petlog Infra (CDKTF)

Petlog의 AWS 리소스를 [CDKTF](https://developer.hashicorp.com/terraform/cdktf)(TypeScript)로 정의한다.
프론트엔드(기존 Vercel)와 백엔드(기존 Railway)는 모두 AWS ECS Fargate + ALB로 완전히 이전했고,
Database도 Railway managed PostgreSQL에서 RDS PostgreSQL로 완전히 이전했다. 이제 세 영역 모두 이
폴더가 정의하는 CDKTF 스택으로 배포/관리한다. **로컬 개발 환경은 그대로다** — `docker-compose.yml`의
로컬 Postgres와 `backend/.env.example`의 로컬 `DATABASE_URL`을 계속 사용하며, 이번 RDS 이전은
배포 환경(ECS Fargate)에만 적용된다.

> **컴퓨트가 App Runner가 아니라 ECS Fargate + ALB인 이유**: 원래는 App Runner로 구현했으나,
> App Runner가 이 프로젝트의 리전인 서울(ap-northeast-2)을 지원하지 않는다는 사실을 DNS/CLI로
> 직접 확인했다(App Runner 서비스 API 엔드포인트 자체가 서울 리전에 존재하지 않는다). RDS/S3/
> CloudFront가 이미 서울에 있고 리전을 옮길 이유가 없었으므로, App Runner 대신 모든 리전에서
> 쓸 수 있는 ECS Fargate + ALB로 전환했다. 즉 이전 버전의 `backend-stack.ts`/`frontend-stack.ts`
> (App Runner 기반)는 실제로는 한 번도 배포에 성공한 적이 없다.

## 왜 CDKTF인가

Petlog 전체가 TypeScript 기반이므로 인프라도 같은 언어로 작성해 컨텍스트 스위칭 비용을 줄인다.
리소스 하나하나를 Terraform HCL이 아닌 타입 안전한 TS 코드로 정의하고, 리뷰/재사용/테스트를
코드베이스의 나머지 부분과 같은 방식으로 다룬다.

## 현재 스택 목록

| 스택 | 파일 | 상태 |
| --- | --- | --- |
| `bootstrap-stack` | `stacks/bootstrap-stack.ts` | 최초 1회만 단독 배포 (state 버킷 + lock 테이블, 로컬 state) |
| `registry-stack` | `stacks/registry-stack.ts` | 구현 완료 (ECR 저장소 2개, 컴퓨트 플랫폼과 무관하게 독립) |
| `storage-stack` | `stacks/storage-stack.ts` | 1순위 구현 완료 (S3 + CloudFront + 백엔드 IAM) |
| `network-stack` | `stacks/network-stack.ts` | 구현 완료 (VPC + private 서브넷 2개 + public 서브넷 2개 + IGW + ALB/ECS 태스크 보안그룹, NAT 없음) |
| `database-stack` | `stacks/database-stack.ts` | 구현 완료 (RDS PostgreSQL, Railway managed DB 완전 대체) |
| `bastion-stack` | `stacks/bastion-stack.ts` | 구현 완료 (SSM 전용 EC2, private RDS에 대한 IAM 기반 팀 접근 — `scripts/db-tunnel.sh` 참고) |
| `backend-stack` | `stacks/backend-stack.ts` | 구현 완료 (ECS Fargate + 공유 ALB + ALB 앞단 CloudFront(HTTPS) + ECS 클러스터, Railway 완전 대체) |
| `frontend-stack` | `stacks/frontend-stack.ts` | 구현 완료 (ECS Fargate, backend-stack의 공유 ALB에 등록, Vercel 완전 대체) |

스택은 도메인 단위로 분리하고, 스택 간 의존은 항상 output 참조(cross-stack reference)로만
전달한다. 한 스택의 배포 실패가 다른 스택에 영향을 주지 않게 하기 위함이다. `main.ts`는 스택을
조합하는 진입점 역할만 한다. 배포/의존 순서는 `bootstrap` → (`registry`, `storage`, `network`, 서로
독립) → `database`(network 참조) → `backend`(storage+registry+network+database 참조, ECS
클러스터 + 공유 ALB 생성) → `frontend`(registry+network+backend 참조, 공유 ALB의 frontend
타겟 그룹에 ECS 서비스 등록) 순이다.

## 사전 준비물 (로컬 개발 환경)

- Node.js 22, npm (레포 루트와 동일) — **정확히 22여야 한다.** 자세한 이유는 아래
  "CDKTF CLI의 단점: Node 버전 고정" 참고.
- [Terraform CLI](https://developer.hashicorp.com/terraform/install) — `cdktf get`이 로컬에서
  AWS Provider 스키마를 생성할 때 내부적으로 사용한다.
- AWS CLI + 자격증명 (`aws configure`) — **실제 배포(diff/deploy)에만 필요**하다. 코드 작성,
  타입체크, `cdktf synth`, `terraform validate`는 자격증명 없이도 가능하다.

### CDKTF CLI의 단점: Node 버전 고정

CDKTF CLI(`cdktf synth`/`diff`/`deploy`)는 내부적으로 `@cdktf/node-pty-prebuilt-multiarch`라는
네이티브 애드온에 의존한다(대화형 plan/apply 출력을 pty로 렌더링하기 위함). 이 패키지는 Node
버전별로 미리 컴파일된(prebuilt) 바이너리를 배포하는데, 그 시점에 아직 지원하지 않는 최신 Node
버전으로 실행하면 `synth`를 포함한 **모든 cdktf 서브커맨드가 즉시 죽는다** — `CI=true` 등으로
비대화형 모드를 강제해도 우회되지 않는다(pty 모듈 자체를 서브커맨드 분기 이전, CLI 진입 시점에
require하기 때문).

실제로 2026-07-13에 로컬 Node를 v24.18.0으로 올린 상태에서 `cdktf synth`/`diff`/`deploy`를
실행했더니 전부 다음 에러로 실패했다.

```
Error: Cannot find module '../build/Release/pty.node'
Require stack:
- .../node_modules/@cdktf/node-pty-prebuilt-multiarch/lib/prebuild-loader.js
...
```

즉 "TypeScript로 인프라를 작성한다"는 CDKTF의 장점과 별개로, **로컬 Node 버전을 CLI가 지원하는
버전(현재 22 LTS)에 계속 맞춰줘야 하는 운영 부담**이 있다. Terraform 코드 자체(synth 결과물)는
Node 버전과 무관하므로, `terraform` CLI를 이미 synth된 `cdktf.out/`에 직접 호출하는 우회는
가능하지만(`scripts/db-credentials.sh`, `scripts/refresh-database-url-ssm.sh` 참고), **코드를
바꾼 뒤 다시 synth해야 하는 경우**(즉 실제 인프라 변경을 반영해야 하는 경우)에는 이 우회가
통하지 않는다 — 결국 Node 22로 맞추는 것 외에는 방법이 없다. nvm 등으로 Node 22를 별도
설치해서 이 워크스페이스 작업 시에만 전환하는 걸 권장한다.

## 자격증명 관리 (로컬)

실제 Access Key/Secret Key는 이 레포 안 어떤 파일에도 넣지 않는다. `.env`가 `.gitignore`로
커밋은 막혀 있더라도, repo 폴더 안에 평문 시크릿이 있으면 실수로 압축해서 공유하거나 백업 도구가
같이 담아가는 등 노출 표면이 늘어난다. 대신 다음처럼 이름이 있는 프로필로 분리한다.

```bash
# 1. 실제 시크릿은 OS 표준 위치(~/.aws/credentials, 레포 밖)에 저장한다.
aws configure --profile petlog
```

`infra/.env`(`.env.example` 참고)에는 시크릿이 아니라 "어떤 프로필/리전을 쓸지"에 대한 참조만
남긴다. 이 값은 유출돼도 그 자체로는 아무 권한이 없다.

```bash
# infra/.env
AWS_PROFILE=petlog
AWS_REGION=ap-northeast-2
```

`main.ts`가 `dotenv/config`를 가장 먼저 로드하므로, `infra/.env`에 `AWS_PROFILE`을 설정해두면
매번 `AWS_PROFILE=... npm run infra:diff`처럼 앞에 붙이지 않아도 `cdktf`가 해당 프로필의
자격증명을 자동으로 사용한다 (Terraform AWS Provider가 `AWS_PROFILE` 환경변수를 기본 지원).

## 왜 `@cdktf/provider-aws` npm 패키지를 쓰지 않는가

한때 HashiCorp는 미리 빌드된 `@cdktf/provider-aws` npm 패키지를 권장했지만, 현재 해당 패키지는
**deprecated** 상태이며 `cdktf get`으로 로컬에서 바인딩을 직접 생성하는 방식을 안내하고 있다
(https://cdk.tf/imports). 그래서 이 프로젝트는 `cdktf.json`의 `terraformProviders`에
`"aws@~> 6.0"` 제약을 선언해두고, `npm install` 시 `postinstall` 훅으로 `cdktf get`을 자동 실행해
`.gen/` 폴더에 바인딩을 생성한다. `.gen/`은 생성물이므로 git에 커밋하지 않는다(`.gitignore` 참고).

즉, **새로 클론한 환경에서는 `npm install` 이후 반드시 인터넷 연결과 로컬 Terraform CLI가
있어야 타입체크(`tsc --noEmit`)가 통과**한다. `postinstall`이 실패하면 `.gen/`이 비어 있어
`storage-stack.ts`의 import가 깨진다.

## 부트스트랩 (최초 1회)

Terraform state는 로컬에 두지 않고 S3 backend + DynamoDB lock 테이블로 원격 저장한다. 그런데
"state를 저장할 S3 버킷"과 "그 버킷을 만드는 CDKTF 스택"을 같은 스택으로 관리하면 순환 의존
(닭이 먼저냐 달걀이 먼저냐)이 생긴다.

그래서 이 두 리소스는 `stacks/bootstrap-stack.ts`라는 **별도 스택**으로 분리했다. 이 스택만
의도적으로 `S3Backend`를 쓰지 않고 **로컬 state**로 관리한다 (자기 자신이 만드는 버킷에 자기
state를 저장할 수 없으므로). 최초 1회, 이 스택만 이름을 지정해 단독 배포한다.

```bash
cd infra
PETLOG_ENV=dev npx cdktf deploy petlog-bootstrap
```

배포 전 `config.ts`의 `TERRAFORM_STATE_BUCKET` 값이 자신의 AWS 계정에서 유일한지 확인한다
(S3 버킷 이름은 전 세계에서 유일해야 한다 — 이 프로젝트는 AWS 계정 ID를 접미사로 붙여뒀다).

`petlog-bootstrap`의 로컬 state 파일(`cdktf.out/stacks/petlog-bootstrap/terraform.tfstate`)은
git에 커밋하지 않는다(`.gitignore` 참고). 이 스택은 거의 변경되지 않는 인프라이므로 로컬 state
유실 리스크가 낮고, 유실되더라도 버킷/테이블이 실제로 존재하면 `terraform import`로 복구할 수
있다. 이 두 리소스는 이후 `cdktf destroy`(다른 스택 대상)로도 삭제되지 않는다.

> AWS CLI로 직접 만들고 싶다면 `git log`의 이전 버전(또는 커밋 히스토리)에 동일한 내용을 하는
> `aws s3api` / `aws dynamodb` 명령 스니펫이 있었으나, 이제는 CDKTF 스택으로 완전히 대체했다 —
> 이 프로젝트의 "AWS 리소스는 콘솔/CLI로 수동 생성하지 않고 반드시 CDKTF 코드로 정의한다"는
> 원칙(`CLAUDE.md`)을 부트스트랩 단계에도 동일하게 적용한 것이다.

## 사용 방법

스택이 여러 개(`petlog-bootstrap`, `petlog-registry-{env}`, `petlog-storage-{env}`,
`petlog-network-{env}`, `petlog-database-{env}`, `petlog-backend-{env}`,
`petlog-frontend-{env}`)이지만, `bootstrap`(최초 1회, 아래 별도 설명) 이후로는 **`deploy:all` 하나로
나머지 6개 스택 전부를 처리한다** — 최초 배포든 이후 변경사항 반영이든 같은 명령이다.

```bash
# 루트에서 의존성 설치 (infra workspace 포함, postinstall로 cdktf get 자동 실행)
npm install

# 코드만 검증하고 싶을 때 (AWS 자격증명 불필요)
npm run typecheck --workspace=infra

# 부트스트랩 (최초 1회만, 위 "부트스트랩" 절 참고 — state 버킷 자체를 만드는 단계라 별도)
cd infra
npm run deploy:bootstrap

# 이후 반복 사용: 무엇이 바뀌었든 diff로 먼저 확인하고 deploy:all 하나로 반영한다
export TF_VAR_jwt_secret="<이미 설정된 값 재사용 또는 openssl rand -hex 32>"
export TF_VAR_refresh_token_secret="<이미 설정된 값 재사용 또는 openssl rand -hex 32>"
npm run diff:all
npm run deploy:all
```

`npm run deploy:all`은 `scripts/deploy.sh`를 실행한다. `cdktf deploy`(terraform apply) 자체가
원래 upsert이므로(없으면 생성, 있으면 변경분만 반영), 이 스크립트는 **최초 배포와 이후 변경 반영을
구분하지 않는다** — 단, ECS 서비스는 ECR에 이미지가 있어야만 태스크를 띄울 수 있다는 예외가 있어서,
스크립트가 각 리포지토리(`petlog-backend-{env}`, `petlog-frontend-{env}`)에 `latest` 태그가
있는지 먼저 확인하고, **없을 때만** 이미지를 빌드/push한다(있으면 건드리지 않는다 — 이미지 교체는
`backend`/`frontend`의 몫, 아래 참고). 스크립트가 하는 일:

1. `registry`/`storage`/`network`/`database` 스택 배포 (서로 독립적이거나 database만 network를
   참조 — 한 번에 배포해도 순서는 cdktf가 의존 그래프로 정렬한다)
2. ECR 로그인 → backend 이미지가 없으면(최초 배포) 레포 루트를 빌드 컨텍스트로 빌드해 push
   (`libs/*` 워크스페이스 의존 때문에 반드시 루트가 컨텍스트여야 한다)
3. `backend-stack` 배포 (ECS 클러스터 + 공유 ALB + CloudFront + 리스너/타겟 그룹 + backend ECS
   서비스를 한 번에 만든다 — App Runner 시절의 "1차 배포" 개념이 없다)
4. 배포된 CloudFront URL(`cloudfront_url` output) 확인 → frontend 이미지가 없으면(최초 배포)
   그 URL을 `--build-arg NEXT_PUBLIC_API_URL`로 주입해 빌드/push (Next.js는 `next build`
   시점에 API URL을 고정시키므로, frontend 이미지는 반드시 CloudFront URL을 안 이후에만 만들
   수 있다 — 다만 CloudFront는 backend-stack 배포 직후 바로 생성되므로 frontend-stack 배포를
   기다릴 필요는 없다)
5. `frontend-stack` 배포 (같은 ALB의 frontend 타겟 그룹에 ECS 서비스를 등록)

App Runner 시절에는 여기에 "6. 배포된 frontend URL로 backend-stack 2차 배포(CORS 반영)"가
있었지만, 이제 backend/frontend가 CloudFront 도메인 하나를 공유하므로 이 단계 자체가 사라졌다
(아래 "ALB 공유로 순환 의존이 사라진 이유" 절 참고).

`cdktf deploy`는 스택마다 대화형으로 diff를 보여주고 승인(`yes` 입력)을 요구하므로(스크립트가
`--auto-approve`를 주지 않는다), `deploy:all`을 실행해도 실제 변경 사항은 스택별로 직접 확인하고
승인한 뒤에만 적용된다 — `.claude/docs/operations/deployment.md`의 "인프라 변경은 자동화하지
않는다" 원칙과 충돌하지 않는다.

`backend`/`frontend` 코드만 바뀐 경우엔 인프라 스택을 다시 배포할 필요가 없다 — 대신 각
워크스페이스에서 이미지만 새로 빌드해 ECR에 교체 push하고, ECS 서비스에 새 배포를 강제한다
(App Runner의 `auto_deployments_enabled`처럼 ECR push만으로 자동 재배포되지 않는다 — ECS는
`aws ecs update-service --force-new-deployment`를 명시적으로 호출해야 최신 `latest` 이미지로
태스크를 다시 띄운다).

```bash
npm run deploy --workspace=backend
NEXT_PUBLIC_API_URL="<backend-stack의 cloudfront_url, https://...>" npm run deploy --workspace=frontend
```

즉 **"인프라 구조가 바뀌면 `infra`에서 `npm run deploy:all`, 애플리케이션 코드만 바뀌면
`backend`/`frontend`에서 `npm run deploy`"**로 책임이 나뉜다. **프론트엔드는 코드가 바뀌지 않아도
CloudFront URL이 바뀌면**(예: backend-stack을 삭제 후 재생성) **이미지를 다시 빌드해야 한다** —
`NEXT_PUBLIC_API_URL`이 빌드 시점에 고정되기 때문이다.

`backend`/`frontend`의 `deploy:ecr-login`/`deploy:ecr-push`는 계정 ID를 코드에 두지 않고
`aws sts get-caller-identity`로 매번 동적으로 조회한다(`infra/scripts/deploy.sh`와 동일한 패턴).
리전/환경만 `backend/.env`·`frontend/.env.local`의 `AWS_REGION`/`PETLOG_ENV`로 관리한다(각각
`.env.example`/`.env.local.example` 참고, 기본값은 `ap-northeast-2`/`dev`).

**버전은 릴리즈(배포) 단위로 각 workspace의 `package.json` version을 수동으로 bump한다**
(workspace별 독립 버전 — root/backend/frontend/mobile이 각자 관리). `npm run deploy`
(`deploy:image`) 체인은 빌드 전에 `deploy:check-version`
(`infra/scripts/check-version-not-deployed.sh`)을 먼저 실행해서, 로컬 `package.json` version과
동일한 태그가 ECR에 이미 있으면(=bump를 깜빡함) 배포를 중단한다. `deploy:ecr-push`
(`infra/scripts/ecr-push.sh`)는 이미지를 `:latest`와 `:<version>` 두 태그로 함께 푸시해서 ECR
자체가 배포 이력 근거가 되게 한다. 백엔드 버전은 `GET /api/health` 응답(`{ status, version }`)에,
프론트엔드 버전은 `/settings` 화면 하단에 노출한다.

**현재 `diff:all`/`deploy:all`은 `dev` 환경 전용이다** — `dotenv -v PETLOG_ENV=dev`로 값을 고정해
호출하므로, 셸에서 `PETLOG_ENV=prod`를 설정해도 무시되고 항상 `-dev` 스택만 대상이 된다. `prod`를
도입하는 시점에는 `diff:all:prod`/`deploy:all:prod` 같은 별도 스크립트를 추가하거나(가장 간단한
방법), `deploy.sh`가 `PETLOG_ENV`를 인자로 받아 스택 이름을 동적으로 구성하도록 바꿔야 한다.

## 백엔드 시크릿 채우기 (TF_VAR_*)

`backend-stack`의 `JWT_SECRET`/`REFRESH_TOKEN_SECRET`은 코드에 실제 값이 없다
(`TerraformVariable`의 `default: ''`는 `synth`/`diff`가 비대화형으로 통과하도록 하는
placeholder일 뿐이다). 실제 `deploy:all` 전에 반드시 환경변수로 주입한다.

```bash
export TF_VAR_jwt_secret="<openssl rand -hex 32 등으로 생성>"
export TF_VAR_refresh_token_secret="<openssl rand -hex 32 등으로 생성>"

npm run deploy:all
```

`TF_VAR_backend_sentry_dsn`/`TF_VAR_frontend_sentry_dsn`은 `mail_provider`와 동일하게 기본값이
`''`라 안 줘도 배포는 성공한다(그 경우 Sentry가 비활성 상태로 배포됨). `jwt_secret`처럼 매번
export가 필요한 값이 아니라 `mail_provider`/`domain_name`과 같은 취급이라, `infra/.env`(gitignore)에
한 번 채워두면 `npm run deploy:all`이 `dotenv -e .env`로 자동으로 읽는다 — backend/frontend가
서로 다른 Sentry 프로젝트를 쓰므로 값도 서로 다르게 채운다.

**RDS 마스터 비밀번호는 사람이 정하지 않는다.** `database-stack`이 `manageMasterUserPassword:
true`로 RDS를 만들면 AWS가 비밀번호를 직접 생성해 Secrets Manager에 저장한다(로테이션도 AWS가
관리). `backend-stack`은 이 시크릿을 `DataAwsSecretsmanagerSecretVersion`으로 읽어서
`username`/`password` 필드를 꺼내고, `database-stack`의 cross-stack reference(RDS 엔드포인트,
DB 이름)와 조합해 `postgresql://petlog:<password>@<endpoint>/petlog` 형태의 `DATABASE_URL`을
CDKTF 코드 안에서 직접 조립한다(완성된 연결 문자열이나 비밀번호를 사람이 변수로 넘기지 않는다).
비밀번호에 `@`/`:`/`/` 같은 문자가 섞여도 연결 문자열이 깨지지 않도록 `Fn.urlencode()`로
퍼센트 인코딩한다.

`backend-stack`을 `diff`/`deploy`하는 IAM 사용자(프로필)는 이 Secrets Manager 시크릿을
읽을 수 있는 `secretsmanager:GetSecretValue` 권한이 있어야 한다 — 데이터 소스 조회는 배포를
실행하는 사람의 자격증명으로 이뤄지며, ECS Task Execution/Task Role과는 무관하다.

이 값들은 셸 히스토리나 `.env`(레포 안)에 남기지 않는다 — 배포 직전에만 셸 세션에 export하고,
필요하면 `unset` 하거나 새 셸을 연다. `TerraformOutput`에 시크릿 값 자체를 노출하지 않으므로
(ECS 컨테이너 정의는 SSM 파라미터 ARN만 참조), state 파일에도 시크릿 원문이 그대로 노출되진 않는다
— 단, Terraform 특성상 `SsmParameter.value`는 state에 평문으로 기록되므로 state 버킷 접근
권한 관리(버킷 자체는 이미 완전 private, `bootstrap-stack` 참고)가 중요하다. RDS 마스터
비밀번호 자체는 state에 남지 않는다(AWS 관리형 시크릿이므로 `DbInstance` 리소스가 비밀번호
값을 속성으로 갖지 않는다).

## ALB 공유로 순환 의존이 사라진 이유

App Runner 시절에는 backend/frontend가 서로 다른 기본 도메인(`*.awsapprunner.com`)을 가져서
`frontend-stack`이 `backend-stack`의 URL을(`NEXT_PUBLIC_API_URL`), `backend-stack`이 CORS를
위해 `frontend-stack`의 URL을(`FRONTEND_URL`) 서로 알아야 하는 진짜 순환 의존이 있었다.
`backend-stack`이 `frontend-stack`보다 먼저 배포되므로 1차 배포 시점엔 frontend URL이 존재하지
않아, "backend 1차 배포 → frontend 배포 → backend 2차 배포"라는 2단계 배포가 필요했다.

ECS Fargate + ALB로 전환하면서 이 문제 자체가 사라졌다. **backend/frontend가 이제 도메인 하나를
공유**하기 때문이다 — `/api/*`는 backend 타겟 그룹으로, 그 외 전부는 frontend 타겟 그룹으로
가는 경로 기반 라우팅이므로, 두 서비스 모두 "이 도메인"이라는 같은 값 하나만 알면 된다. 이
도메인은 `backend-stack`이 ALB 앞단에 만든 CloudFront 배포의 기본 도메인이고(HTTPS 지원 추가
이후), 그 스택의 배포가 끝나는 즉시 알 수 있으므로(`cloudfront_url` output), `frontend-stack`
배포를 기다릴 필요 없이 `backend-stack`의 `FRONTEND_URL` 컨테이너 환경변수와 frontend Docker
이미지의 `NEXT_PUBLIC_API_URL` 빌드 인자를 **한 번에 같은 값으로** 채울 수 있다.
`TF_VAR_frontend_url` 같은 수동 변수도, 2차 배포 단계도 더 이상 없다.

## 백엔드 환경변수 계약

`storage-stack`의 output은 백엔드(NestJS) `StorageProvider` 구현체가 그대로 소비하는 계약이다.
이름을 임의로 바꾸지 않는다. 이제 이 값들은 `backend-stack`이 ECS Task Definition의
`environment`/`secrets` 필드로 cross-stack reference해 자동 주입하므로, 수동으로 값을 복사해
콘솔에 입력할 필요가 없다.

| 환경변수 | 값 출처 (terraform output) | 종류 |
| --- | --- | --- |
| `AWS_REGION` | `output_aws_region` | 일반 |
| `AWS_S3_BUCKET_NAME` | `aws_s3_bucket_name` | 일반 |
| `AWS_CLOUDFRONT_DOMAIN` | `aws_cloudfront_domain` (이미지 최종 URL = `https://{AWS_CLOUDFRONT_DOMAIN}/{key}`) | 일반 |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | `backend-stack`의 `TerraformVariable` (기본값 `15m`/`30d`) | 일반 |
| `NODE_ENV` | `backend-stack`/`frontend-stack`에서 `production` 고정 | 일반 |
| `FRONTEND_URL` | `backend-stack`의 `cloudfront_url`(공유 ALB 앞단 CloudFront HTTPS URL, 자기 자신의 output을 그대로 컨테이너 환경변수로 사용) | 일반 |
| `DATABASE_URL` | `backend-stack`이 `database-stack`의 RDS 엔드포인트(cross-stack reference) + AWS 관리형 마스터 비밀번호(Secrets Manager)를 조합해 만든 SSM Parameter(SecureString) ARN | 시크릿 |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | `backend-stack`이 만든 SSM Parameter(SecureString) ARN | 시크릿 |
| `NEXT_PUBLIC_API_URL` (빌드 인자, 런타임 아님) | `backend-stack`의 `cloudfront_url` (frontend-stack이 `expected_next_public_api_url`로 다시 출력) | 일반 (프론트엔드 Docker 빌드 시점) |
| `SENTRY_DSN` (backend) | `backend-stack`의 `TerraformVariable`(기본값 `''`, `TF_VAR_backend_sentry_dsn`으로 주입). 비어있으면 `backend/src/instrument.ts`가 Sentry를 초기화하지 않는다(로컬과 동일 계약) | 일반 |
| `SENTRY_DSN` (frontend, 서버/edge용) | `frontend-stack`의 `TerraformVariable`(기본값 `''`, `TF_VAR_frontend_sentry_dsn`으로 주입). 비어있으면 `sentry.server.config.ts`/`sentry.edge.config.ts`가 Sentry를 초기화하지 않는다 | 일반 |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` (frontend, 빌드 인자) | `frontend/.env.deploy`(gitignore) — `deploy:build`가 `dotenv`로 읽어 `docker build --build-arg`로 전달. `next build` 시점에 클라이언트 번들에 인라인되므로 런타임 ECS 환경변수로는 넣을 수 없다 | 일반 (프론트엔드 Docker 빌드 시점) — backend/frontend가 서로 다른 Sentry DSN(별도 프로젝트)을 쓰므로 백엔드용과 이름을 분리했다 |

`FRONTEND_URL`과 `NEXT_PUBLIC_API_URL`이 같은 값(공유 ALB 앞단 CloudFront HTTPS URL)을 가리키는
것은 의도된 설계다 — "ALB 공유로 순환 의존이 사라진 이유" 절 참고. ALB 자체의 원시 URL
(`alb_url` output, http://)은 더 이상 애플리케이션 환경변수로 쓰이지 않고, ALB 보안그룹이
CloudFront 오리진 IP 대역만 허용하므로 외부에서 직접 접속도 되지 않는다 — CloudFront 오리진
참고용으로만 output에 남겨둔다.

배포 후 값 확인:

```bash
cd infra
terraform -chdir=cdktf.out/stacks/petlog-storage-dev output
```

## IAM 자격증명 처리 (중요)

### storage-stack의 레거시 IAM User (Railway 시절 워크어라운드)

`backend_iam_access_key_id` / `backend_iam_secret_access_key`는 `sensitive` 출력이다. 백엔드가
Railway(AWS 외부)에서 호스팅되던 시절 IAM Role을 assume할 수 없어서, 정적 액세스 키를 발급하는
IAM User(`petlog-backend-uploader-{env}`)를 사용했다.

**이제 backend-stack이 ECS Task Role로 완전히 대체했으므로, 이 IAM User/Access Key는 더 이상
애플리케이션 코드에서 쓰이지 않는다.** ECS Task Role은 임시 자격증명(자동 rotate)을 쓰므로 정적
키보다 안전하다. Railway → ECS Fargate 전환이 실제 트래픽으로 충분히 검증되면, 다음을 후속
변경으로 진행한다.

1. Railway 프로젝트 환경변수에 등록되어 있던 기존 Access Key/Secret Key를 폐기한다.
2. `storage-stack.ts`에서 `backendUser`/`backendAccessKey`/관련 output을 제거하는 PR을 별도로 올린다
   (지금 이 작업에서 함께 지우지 않는 이유: 롤백 여유를 남겨두기 위함 — 인프라 삭제는 신중하게).

### backend-stack / frontend-stack의 ECS Fargate Role

App Runner는 Role 종류별로 다른 서비스 주체(Access Role은 `build.apprunner.amazonaws.com`,
Instance Role은 `tasks.apprunner.amazonaws.com`)를 썼지만, ECS Fargate는 Task Execution
Role/Task Role 모두 동일한 `ecs-tasks.amazonaws.com`을 신뢰 주체로 쓴다(`shared/ecs-iam.ts`).

- **Task Execution Role** (App Runner Access Role 대체) — ECR pull + CloudWatch Logs 전송.
  AWS 관리형 정책 `AmazonECSTaskExecutionRolePolicy`를 붙인다. 이 정책은 SSM/Secrets Manager
  읽기 권한을 포함하지 않으므로, backend-stack의 Execution Role에는 추가로 인라인 정책
  2개가 붙는다.
  - SSM `GetParameters` (자신의 3개 SecureString 파라미터 ARN만, 와일드카드 없음)
  - KMS `Decrypt` (SecureString이 기본으로 쓰는 AWS 관리형 키 `alias/aws/ssm`의 실제 키 ARN만,
    `DataAwsKmsAlias`로 조회 — SecureString은 암호화되어 있으므로 GetParameters만으로는
    복호화까지 되지 않는다)
  - frontend-stack의 Execution Role은 SSM 시크릿을 참조하지 않으므로 관리형 정책만 붙는다.
- **Task Role** (App Runner Instance Role 대체) — 컨테이너가 런타임에 실제로 assume한다.
  - backend-stack: S3 PutObject/GetObject/DeleteObject (storage-stack 버킷,
    `shared/s3-access-policy.ts` 재사용) 인라인 정책 1개만 붙는다.
  - frontend-stack은 AWS 리소스를 직접 호출하지 않으므로 Task Role 자체가 없다(Execution
    Role만 있다).
  - **RDS 접근에는 IAM 권한을 추가하지 않는다.** RDS는 IAM이 아니라 네트워크 레벨(보안그룹) +
    DB 자체 인증(마스터 유저/비밀번호)으로 접근을 제어하기 때문이다.

## 아키텍처 결정 요약

- **버킷은 완전 private.** Block Public Access 4개 항목을 전부 차단한다. 공개 서빙은 CloudFront +
  Origin Access Control(OAC)로만 하고, 버킷 정책은 "이 CloudFront 배포에서 온 요청만" 허용하도록
  `AWS:SourceArn` 조건을 건다 (confused-deputy 방지).
- **리전은 기본 `ap-northeast-2`(서울)**, `TerraformVariable`로 재정의 가능하다.
- **버킷 네이밍**: `petlog-uploads-{env}` (예: `petlog-uploads-dev`, `petlog-uploads-prod`).
- **커스텀 도메인/ACM 인증서 없음.** CloudFront와 ALB 모두 기본 도메인만 사용해 Route53/ACM
  의존성과 그에 따른 운영 부담을 없앴다. ALB 리스너는 포트 80(HTTP)만 연다. 필요해지면 별도로 추가한다.
- **ALB 앞단에 CloudFront를 추가해 HTTPS를 지원한다 (`backend-stack.ts`).** ALB는
  `*.elb.amazonaws.com` 도메인이라 ACM 인증서를 발급받을 수 없어(AWS가 자기 소유 도메인에는
  인증서를 안 내준다), storage-stack의 이미지 CloudFront와 동일하게 CloudFront 기본
  `*.cloudfront.net` 도메인에 자동으로 붙는 무료 TLS 인증서를 활용했다. 다만 이 앱은 정적
  콘텐츠가 아니라 로그인 세션이 있는 동적 API/웹 서버이므로, storage-stack의 `CachingOptimized`
  대신 `CachingDisabled` 정책으로 캐싱을 사실상 껐고, 오리진 요청 정책은 쿠키/헤더/쿼리스트링을
  전부 오리진(ALB)까지 전달하는 `Managed-AllViewerExceptHostHeader`를 쓴다. 허용 메서드도
  GET/HEAD뿐 아니라 PUT/POST/PATCH/DELETE까지 전부 연다(API 쓰기 요청 지원). ALB 보안그룹은
  AWS 관리형 프리픽스 리스트(`com.amazonaws.global.cloudfront.origin-facing`)로 CloudFront
  오리진 IP 대역만 허용하도록 좁혀, 사용자가 CloudFront/HTTPS를 우회해 ALB에 평문 HTTP로 직접
  접근할 수 없게 했다. 상세 배경은
  `.claude/docs/decisions/020-cloudfront-https.md` 참고.
- **컴퓨트는 ECS Fargate + ALB** (App Runner가 서울 리전을 지원하지 않아 전환, 상단 안내 참고).
  backend/frontend가 ALB 1개를 공유해 ALB 시간당 고정비를 2배로 만들지 않는다 — 경로 기반
  라우팅(`/api/*` → backend, 그 외 전부 → frontend)으로 한 도메인에서 두 서비스를 나눈다.
- **VPC는 RDS + ECS Fargate + ALB 전용으로 존재한다 (`network-stack.ts`).** Private 서브넷 2개
  (RDS 전용, 기존 유지)와 public 서브넷 2개(ALB + ECS 태스크 전용, 오늘 추가)로 구성된다.
- **NAT Gateway는 만들지 않는다.** ALB에는 반드시 public 서브넷이 필요해 Internet Gateway를
  추가했지만(월 고정비 없음), ECS Fargate 태스크의 아웃바운드 인터넷(ECR pull, SSM, Secrets
  Manager, S3 API 호출)은 태스크를 이 public 서브넷에 두고 `assignPublicIp: ENABLED`로 해결해
  NAT Gateway(월 $30+ 고정비)를 회피한다. 인바운드는 보안그룹으로 ALB에서만 열어(4000/3000
  포트) 사실상 "public 서브넷에 있지만 인바운드는 ALB로만 제한"되는 구조를 유지한다.

## 비용 관련 참고사항

NAT Gateway, Multi-AZ RDS는 의도적으로 만들지 않았다. 다만 **ALB는 시간당 고정비가 있는
리소스이며, App Runner에서 ECS Fargate로 전환하며 새로 생겼다** — App Runner가 서울 리전을
지원하지 않아 불가피하게 감수한 비용이다(상단 안내 참고). backend/frontend가 ALB 1개를
공유하도록 설계해 이 고정비가 2배가 되지 않게 했다.

| 리소스 | 프리티어 | 프리티어 밖 예상 비용 (개인 프로젝트 트래픽 기준) |
| --- | --- | --- |
| S3 (Standard) | 5GB 저장 / 20,000 GET / 2,000 PUT (12개월) | 스토리지 $0.023/GB, 요청 비용은 미미한 수준 |
| CloudFront (배포 2개: storage-stack 이미지용 + backend-stack ALB HTTPS 종단용) | 1TB 아웃바운드 + 1,000만 요청 (12개월, 계정 단위, 배포 2개 합산) | `PriceClass_100` 기준 GB당 약 $0.085 (아웃바운드). ALB용 배포는 캐싱을 껐으므로(`CachingDisabled`) 모든 응답이 오리진까지 왕복하지만, 요청 수 자체의 개인 프로젝트 트래픽에서는 비용 영향이 크지 않다 |
| DynamoDB (lock 테이블) | 25GB + 온디맨드 소량은 사실상 무료 | LockID 1건짜리 테이블이라 사실상 $0에 수렴 |
| IAM (User/Role/Policy) | 항상 무료 | $0 |
| ECR | 프라이빗 저장소 500MB (12개월) | $0.10/GB-월. lifecycle policy로 이미지 최근 10개만 유지해 무한 누적 방지 |
| ALB (1개, backend/frontend 공유) | 프리티어 없음 | 시간당 약 $0.0252(서울 리전) → 월 약 $18 고정비 + LCU(트래픽 처리량) 종량 요금. 개인 프로젝트 트래픽에서는 LCU 비용은 미미하고 고정비가 대부분을 차지한다 |
| ECS Fargate (256 CPU / 512 MiB, 태스크 2개) | 프리티어 없음 | vCPU $0.04656/vCPU-시간 + 메모리 $0.00511/GB-시간(서울 리전). 태스크 2개(backend+frontend)를 상시 가동해도 월 약 $8~10 수준 |
| RDS (`db.t4g.micro`, Single-AZ, gp3 20GB) | 프리티어 있음 — `db.t4g.micro`(또는 `db.t3.micro`) 월 750시간 + gp2/gp3 20GB 저장 (계정 생성 후 12개월) | 프리티어 종료 후: 인스턴스 시간당 약 $0.016(서울 리전 기준, 온디맨드) → 월 약 $12, gp3 스토리지 $0.092/GB-월(20GB 기준 약 $1.8/월), 백업 스토리지(할당량 초과분)는 별도 과금 |
| VPC / 서브넷 / 보안그룹 / Internet Gateway (`network-stack`) | 항상 무료 | $0 (NAT Gateway를 만들지 않았으므로 그 부분의 시간당 고정비는 없다. IGW 자체는 무료) |

개인 프로젝트 규모에서는 ALB 고정비(월 약 $18)가 새로 추가되어, 프리티어 기간 중에도 월
30~35달러 수준, 프리티어 종료 후에는 RDS 비용이 더해져 월 45~50달러 내외로 예상한다 (ALB 1개 +
ECS Fargate 태스크 2개 + RDS Single-AZ 기준). App Runner 대비 비용이 늘어난 것은 서울 리전
지원 여부라는 제약 때문에 감수한 트레이드오프다. 트래픽이 거의 없는 개발/포트폴리오용
환경이라면 사용하지 않을 때 `cdktf destroy petlog-backend-dev`/`petlog-frontend-dev`로
내렸다가 필요할 때 다시 `deploy`하는 것도 고려할 수 있다(ALB 고정비까지 함께 없앨 수 있다 —
ECR 이미지는 registry-stack에 그대로 남아있으므로 재배포가 빠르다). RDS는 destroy 시 dev
환경에서는 `skipFinalSnapshot: true`라 즉시 삭제되지만(재생성 시 데이터가 없는 새 DB로 시작),
prod는 최종 스냅샷을 남기고 삭제된다. 버킷에는 `S3BucketLifecycleConfiguration`으로 미완료
멀티파트 업로드(7일 후) 및 오래된 버전 객체(30일 후) 자동 정리 규칙을 걸어 스토리지 비용이
무한정 쌓이지 않게 했다. CloudWatch Logs 보관 기간도 7일로 짧게 잡아 로그 스토리지 비용을
억제했다.

## CI/CD (아직 미구현)

`.github/workflows/ci.yml`과는 별도로, 인프라 전용 파이프라인은 다음 원칙으로 나중에 추가한다
(현재는 로컬에서 수동으로만 `diff`/`deploy`한다).

- PR: `cdktf diff` 결과를 코멘트로 남긴다. 실제 배포는 하지 않는다.
- `main` 머지: `cdktf deploy`는 수동 승인(manual approval) 단계를 거친 뒤에만 실행한다.
- GitHub Actions 러너에는 Terraform CLI(`hashicorp/setup-terraform`)가 기본 설치돼 있지 않으므로
  워크플로 작성 시 별도 설치 스텝이 필요하다.

## 관련 문서 / 이슈

- `.claude/docs/decisions/017-local-disk-file-storage.md` — 로컬 디스크 저장의 한계와 S3 전환 배경
- https://github.com/awjae/petlog/issues/2 — 이 작업의 트래킹 이슈
