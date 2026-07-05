# Petlog Infra (CDKTF)

Petlog의 AWS 리소스를 [CDKTF](https://developer.hashicorp.com/terraform/cdktf)(TypeScript)로 정의한다.
프론트엔드(기존 Vercel)와 백엔드(기존 Railway)는 모두 AWS App Runner로 완전히 이전했고, Database도
Railway managed PostgreSQL에서 RDS PostgreSQL로 완전히 이전했다. 이제 세 영역 모두 이 폴더가
정의하는 CDKTF 스택으로 배포/관리한다. **로컬 개발 환경은 그대로다** — `docker-compose.yml`의
로컬 Postgres와 `backend/.env.example`의 로컬 `DATABASE_URL`을 계속 사용하며, 이번 RDS 이전은
배포 환경(App Runner)에만 적용된다.

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
| `network-stack` | `stacks/network-stack.ts` | 구현 완료 (VPC + private 서브넷 2개 + RDS/Connector 보안그룹, NAT/IGW 없음) |
| `database-stack` | `stacks/database-stack.ts` | 구현 완료 (RDS PostgreSQL, Railway managed DB 완전 대체) |
| `backend-stack` | `stacks/backend-stack.ts` | 구현 완료 (App Runner, Railway 완전 대체) |
| `frontend-stack` | `stacks/frontend-stack.ts` | 구현 완료 (App Runner, Vercel 완전 대체) |

스택은 도메인 단위로 분리하고, 스택 간 의존은 항상 output 참조(cross-stack reference)로만
전달한다. 한 스택의 배포 실패가 다른 스택에 영향을 주지 않게 하기 위함이다. `main.ts`는 스택을
조합하는 진입점 역할만 한다. 배포/의존 순서는 `bootstrap` → (`registry`, `storage`, `network`, 서로
독립) → `database`(network 참조) → `backend`(storage+registry+network+database 참조) →
`frontend`(registry+backend 참조) 순이다.

## 사전 준비물 (로컬 개발 환경)

- Node.js 22, npm (레포 루트와 동일)
- [Terraform CLI](https://developer.hashicorp.com/terraform/install) — `cdktf get`이 로컬에서
  AWS Provider 스키마를 생성할 때 내부적으로 사용한다.
- AWS CLI + 자격증명 (`aws configure`) — **실제 배포(diff/deploy)에만 필요**하다. 코드 작성,
  타입체크, `cdktf synth`, `terraform validate`는 자격증명 없이도 가능하다.

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
`petlog-frontend-{env}`)이므로, `diff`/`deploy`는 반드시 스택 이름을 지정한다 (지정하지 않으면
CDKTF가 어떤 스택을 대상으로 할지 몰라 에러를 낸다).

```bash
# 루트에서 의존성 설치 (infra workspace 포함, postinstall로 cdktf get 자동 실행)
npm install

# 코드만 검증하고 싶을 때 (AWS 자격증명 불필요)
npm run typecheck --workspace=infra
cd infra && npx cdktf list   # 현재 존재하는 스택 이름 확인
npx cdktf synth              # Terraform JSON으로 합성만 하고 배포하지 않음

# 부트스트랩 (최초 1회만, 위 "부트스트랩" 절 참고)
PETLOG_ENV=dev npx cdktf deploy petlog-bootstrap

# registry-stack / storage-stack / network-stack은 서로 독립적이므로 순서 상관없이 먼저 배포한다
PETLOG_ENV=dev npx cdktf diff petlog-registry-dev
PETLOG_ENV=dev npx cdktf deploy petlog-registry-dev
PETLOG_ENV=dev npx cdktf diff petlog-storage-dev
PETLOG_ENV=dev npx cdktf deploy petlog-storage-dev
PETLOG_ENV=dev npx cdktf diff petlog-network-dev
PETLOG_ENV=dev npx cdktf deploy petlog-network-dev

# database-stack (network-stack cross-stack reference 필요). RDS 마스터 비밀번호는
# manageMasterUserPassword로 AWS가 자동 생성/관리하므로 여기서 별도로 넘길 시크릿이 없다.
PETLOG_ENV=dev npx cdktf diff petlog-database-dev
PETLOG_ENV=dev npx cdktf deploy petlog-database-dev

# backend-stack (registry-stack/storage-stack/network-stack/database-stack cross-stack
# reference 필요 — TF_VAR_*로 시크릿 주입, 아래 "백엔드 시크릿 채우기" 절 참고). ECR에 이미지가
# 없으면 App Runner 배포가 실패하니 "최초 배포 전 수동 절차"를 먼저 따른다.
PETLOG_ENV=dev npx cdktf diff petlog-backend-dev
PETLOG_ENV=dev npx cdktf deploy petlog-backend-dev

# frontend-stack (backend-stack의 서비스 URL을 cross-stack reference로 읽으므로 반드시
# backend-stack 배포 이후에 실행한다)
PETLOG_ENV=dev npx cdktf diff petlog-frontend-dev
PETLOG_ENV=dev npx cdktf deploy petlog-frontend-dev
```

`PETLOG_ENV`를 생략하면 기본값은 `dev`다. `prod` 환경을 배포하려면 `PETLOG_ENV=prod`로 실행하고
스택 이름도 `petlog-storage-prod`처럼 바꾼다 (state key, 리소스 이름이 `-prod`로 분리되므로 dev와
서로 영향을 주지 않는다).

## 최초 배포 전 수동 절차 (Docker 이미지 빌드 & ECR push)

App Runner는 ECR에 이미지가 있어야 서비스가 뜬다. `registry-stack`만 배포된 상태에서 곧바로
`backend-stack`/`frontend-stack`을 배포하면 이미지가 없어 App Runner 배포가 실패한다. CI/CD로
이미지 빌드/푸시를 자동화하는 것은 이번 범위 밖이므로, 최초 1회(및 코드 변경 시마다) 아래 절차를
수동으로 실행한다.

**중요**: 두 Dockerfile 모두 backend/frontend가 `libs/*` 워크스페이스에 의존하기 때문에(정확히는
backend만 의존하지만 두 Dockerfile 모두 동일한 관례를 따른다) **반드시 레포 루트를 빌드
컨텍스트로 사용**한다. `backend/`나 `frontend/` 디렉토리만 컨텍스트로 주면 빌드가 실패한다.

또한 **프론트엔드의 `NEXT_PUBLIC_API_URL`은 App Runner 런타임 환경변수가 아니라 Docker 빌드
시점의 `--build-arg`로 주입해야 한다.** Next.js는 `next.config.ts`의 `rewrites()` 목적지를
`next build` 시점에 고정시키므로 (frontend-architect가 빌드 산출물로 직접 검증함), 배포 후
런타임 환경변수를 바꿔도 프론트엔드는 여전히 빌드할 때의 URL로 백엔드를 호출한다. 그래서
**프론트엔드 이미지는 backend-stack이 배포되어 실제 URL을 알 수 있게 된 이후에만 빌드**한다
(아래 순서가 바로 그 이유다).

```bash
# 0. ECR 로그인 (registry-stack 배포 후 얻은 계정 ID/리전으로)
aws ecr get-login-password --region ap-northeast-2 --profile petlog \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# 1. 백엔드 이미지 빌드 & push — 레포 루트가 빌드 컨텍스트
docker build -f backend/Dockerfile -t petlog-backend .
docker tag petlog-backend:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/petlog-backend-dev:latest
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/petlog-backend-dev:latest

# 2. backend-stack 배포 (아래 "백엔드 시크릿 채우기" 절의 TF_VAR_* 먼저 export)
PETLOG_ENV=dev npx cdktf deploy petlog-backend-dev

# 3. 배포된 백엔드의 실제 URL 확인 (frontend 이미지 빌드에 필요한 값)
BACKEND_URL=$(terraform -chdir=cdktf.out/stacks/petlog-backend-dev output -raw backend_service_url)
echo "https://${BACKEND_URL}"   # frontend-stack의 expected_next_public_api_url 출력과 같은 값이어야 한다

# 4. 프론트엔드 이미지 빌드 & push — 레포 루트가 빌드 컨텍스트, NEXT_PUBLIC_API_URL을 build-arg로 주입
docker build -f frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="https://${BACKEND_URL}" \
  -t petlog-frontend .
docker tag petlog-frontend:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/petlog-frontend-dev:latest
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/petlog-frontend-dev:latest

# 5. frontend-stack 배포
PETLOG_ENV=dev npx cdktf deploy petlog-frontend-dev
```

이후 백엔드 코드만 바뀌면 1번(이미지 재빌드/push)만 반복하면 된다 — `auto_deployments_enabled:
true` 설정 덕분에 App Runner가 CDKTF 재배포 없이 자동으로 새 버전을 감지해 재배포한다. 반면
**프론트엔드는 코드가 바뀌지 않아도 백엔드 URL이 바뀌면(예: backend-stack을 삭제 후 재생성)
이미지를 다시 빌드해야 한다** — `NEXT_PUBLIC_API_URL`이 빌드 시점에 고정되기 때문이다.

## 백엔드 시크릿 채우기 (TF_VAR_*)

`backend-stack`의 `JWT_SECRET`/`REFRESH_TOKEN_SECRET`은 코드에 실제 값이 없다
(`TerraformVariable`의 `default: ''`는 `synth`/`diff`가 비대화형으로 통과하도록 하는
placeholder일 뿐이다). 실제 `deploy` 전에 반드시 환경변수로 주입한다.

```bash
export TF_VAR_jwt_secret="<openssl rand -hex 32 등으로 생성>"
export TF_VAR_refresh_token_secret="<openssl rand -hex 32 등으로 생성>"

PETLOG_ENV=dev npx cdktf deploy petlog-database-dev
PETLOG_ENV=dev npx cdktf deploy petlog-backend-dev
```

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
실행하는 사람의 자격증명으로 이뤄지며, App Runner Instance Role과는 무관하다.

이 값들은 셸 히스토리나 `.env`(레포 안)에 남기지 않는다 — 배포 직전에만 셸 세션에 export하고,
필요하면 `unset` 하거나 새 셸을 연다. `TerraformOutput`에 시크릿 값 자체를 노출하지 않으므로
(App Runner는 SSM 파라미터 ARN만 참조), state 파일에도 시크릿 원문이 그대로 노출되진 않는다
— 단, Terraform 특성상 `SsmParameter.value`는 state에 평문으로 기록되므로 state 버킷 접근
권한 관리(버킷 자체는 이미 완전 private, `bootstrap-stack` 참고)가 중요하다. RDS 마스터
비밀번호 자체는 state에 남지 않는다(AWS 관리형 시크릿이므로 `DbInstance` 리소스가 비밀번호
값을 속성으로 갖지 않는다).

## 2단계 배포 (backend ↔ frontend 순환 의존 해결)

`frontend-stack`은 배포된 `backend-stack`의 URL을 알아야 하고(`NEXT_PUBLIC_API_URL`),
`backend-stack`도 CORS를 위해 `frontend-stack`의 URL을 알아야 한다. 그런데 `backend-stack`이
`frontend-stack`보다 먼저 배포되므로, 1차 배포 시점엔 frontend URL이 존재하지 않는 진짜 순환
의존이다. 이를 억지로 없애려 하지 않고 정직하게 2단계로 나눈다.

1. **1차 배포**: `backend-stack`을 `frontend_url` 변수 없이(기본값 `''`) 배포한다. 이 상태에서
   백엔드 애플리케이션의 CORS 설정은 `FRONTEND_URL`이 비어있을 때 App Runner 기본 도메인 패턴
   (`*.awsapprunner.com`)을 잠정 허용하도록 구성되어 있어야 한다 — **이건 배포 초기에만 쓰는
   느슨한 임시 조치**이며, 실제 프로덕션 트래픽에서는 반드시 2차 배포로 특정 Origin만 허용하도록
   좁혀야 한다.
2. `frontend-stack`을 배포한다. 출력값 `frontend_service_url`로 실제 App Runner 도메인을 얻는다.
3. **2차 배포**: 얻은 URL로 `TF_VAR_frontend_url="https://<frontend_service_url>"`을 채워
   `backend-stack`만 다시 배포한다.

```bash
# 1차 배포
PETLOG_ENV=dev npx cdktf deploy petlog-backend-dev
PETLOG_ENV=dev npx cdktf deploy petlog-frontend-dev

# frontend URL 확인
terraform -chdir=cdktf.out/stacks/petlog-frontend-dev output -raw frontend_service_url

# 2차 배포: backend만 다시 배포해 FRONTEND_URL을 실제 값으로 채운다
export TF_VAR_frontend_url="https://<위에서 얻은 값>"
PETLOG_ENV=dev npx cdktf deploy petlog-backend-dev
```

## 백엔드 환경변수 계약

`storage-stack`의 output은 백엔드(NestJS) `StorageProvider` 구현체가 그대로 소비하는 계약이다.
이름을 임의로 바꾸지 않는다. 이제 이 값들은 `backend-stack`이 App Runner의
`runtimeEnvironmentVariables`로 cross-stack reference해 자동 주입하므로, 수동으로 값을 복사해
App Runner 콘솔에 입력할 필요가 없다.

| 환경변수 | 값 출처 (terraform output) | 종류 |
| --- | --- | --- |
| `AWS_REGION` | `output_aws_region` | 일반 |
| `AWS_S3_BUCKET_NAME` | `aws_s3_bucket_name` | 일반 |
| `AWS_CLOUDFRONT_DOMAIN` | `aws_cloudfront_domain` (이미지 최종 URL = `https://{AWS_CLOUDFRONT_DOMAIN}/{key}`) | 일반 |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | `backend-stack`의 `TerraformVariable` (기본값 `15m`/`30d`) | 일반 |
| `NODE_ENV` | `backend-stack`에서 `production` 고정 | 일반 |
| `FRONTEND_URL` | `backend-stack`의 `frontend_url` 변수 (2단계 배포 절 참고) | 일반 |
| `DATABASE_URL` | `backend-stack`이 `database-stack`의 RDS 엔드포인트(cross-stack reference) + AWS 관리형 마스터 비밀번호(Secrets Manager)를 조합해 만든 SSM Parameter(SecureString) ARN | 시크릿 |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | `backend-stack`이 만든 SSM Parameter(SecureString) ARN | 시크릿 |
| `NEXT_PUBLIC_API_URL` | `frontend-stack`이 `backend-stack`의 `service_url`을 cross-stack reference | 일반 (프론트엔드) |

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

**이제 backend-stack이 App Runner Instance Role로 완전히 대체했으므로, 이 IAM User/Access Key는
더 이상 애플리케이션 코드에서 쓰이지 않는다.** App Runner Instance Role은 임시 자격증명(자동
rotate)을 쓰므로 정적 키보다 안전하다. Railway → App Runner 전환이 실제 트래픽으로 충분히
검증되면(2단계 배포 절 참고), 다음을 후속 변경으로 진행한다.

1. Railway 프로젝트 환경변수에 등록되어 있던 기존 Access Key/Secret Key를 폐기한다.
2. `storage-stack.ts`에서 `backendUser`/`backendAccessKey`/관련 output을 제거하는 PR을 별도로 올린다
   (지금 이 작업에서 함께 지우지 않는 이유: 롤백 여유를 남겨두기 위함 — 인프라 삭제는 신중하게).

### backend-stack / frontend-stack의 App Runner Role

- **Access Role** (`build.apprunner.amazonaws.com` trust) — ECR에서 이미지를 pull하는 용도.
  AWS 관리형 정책 `AWSAppRunnerServicePolicyForECRAccess`만 붙인다 (`shared/apprunner-iam.ts`).
- **Instance Role** (`tasks.apprunner.amazonaws.com` trust) — 컨테이너가 런타임에 실제로 assume한다.
  backend-stack의 Instance Role에는 다음 두 개의 최소 권한 인라인 정책만 붙는다.
  - S3 PutObject/GetObject/DeleteObject (storage-stack 버킷, `shared/s3-access-policy.ts` 재사용)
  - SSM `GetParameters` (자신의 3개 SecureString 파라미터 ARN만, 와일드카드 없음)
  - frontend-stack은 AWS 리소스를 직접 호출하지 않으므로 Instance Role 자체가 없다.
  - **RDS 접근에는 IAM 권한을 추가하지 않는다.** RDS는 IAM이 아니라 네트워크 레벨(VPC Connector +
    보안그룹) + DB 자체 인증(마스터 유저/비밀번호)으로 접근을 제어하기 때문이다.

## 아키텍처 결정 요약

- **버킷은 완전 private.** Block Public Access 4개 항목을 전부 차단한다. 공개 서빙은 CloudFront +
  Origin Access Control(OAC)로만 하고, 버킷 정책은 "이 CloudFront 배포에서 온 요청만" 허용하도록
  `AWS:SourceArn` 조건을 건다 (confused-deputy 방지).
- **리전은 기본 `ap-northeast-2`(서울)**, `TerraformVariable`로 재정의 가능하다.
- **버킷 네이밍**: `petlog-uploads-{env}` (예: `petlog-uploads-dev`, `petlog-uploads-prod`).
- **커스텀 도메인/ACM 인증서 없음.** CloudFront와 App Runner 모두 기본 도메인만 사용해 Route53/ACM
  의존성과 그에 따른 운영 부담을 없앴다. 필요해지면 별도로 추가한다.
- **컴퓨트는 App Runner** (ECS Fargate 아님). 개인 프로젝트 비용/운영 단순함 우선 — ALB/VPC 고정비가
  없다. 대신 ECS Fargate로 쉽게 전환 가능하도록 레지스트리(ECR)와 IAM 권한 "정의"를 컴퓨트 플랫폼과
  분리해뒀다 (아래 "ECS Fargate로 전환 시" 절 참고).
- **VPC는 RDS + App Runner VPC Connector 전용으로만 존재한다 (`network-stack.ts`).** App Runner
  서비스 자체(컴퓨트)는 VPC 없이 동작하고, RDS를 private 서브넷에 두면서 App Runner가 거기 접근할
  통로(VPC Connector)만 필요해서 최소 구성으로 VPC를 만들었다.
- **NAT Gateway, Internet Gateway, Public 서브넷은 만들지 않는다.** RDS도 App Runner VPC
  Connector도 아웃바운드 인터넷이 필요 없어서(RDS에만 연결하면 됨), NAT Gateway(월 $30+ 고정비)를
  회피할 수 있다. VPC 안의 서브넷은 모두 private이며 완전히 격리되어 있다.

## ECS Fargate로 전환 시

App Runner에서 ECS Fargate로 옮기기로 결정하면, 아래처럼 **바뀌는 것**과 **그대로 두는 것**이
명확히 나뉜다. `backend-stack.ts`/`frontend-stack.ts` 내부 구현만 교체하면 되고, 다른 스택/계약은
그대로 유지된다.

| 항목 | 그대로 유지 | 교체 필요 |
| --- | --- | --- |
| `registry-stack.ts` (ECR 저장소, lifecycle policy) | 그대로 | - |
| `shared/s3-access-policy.ts` (S3 권한 "정의") | 그대로 (Task Role에 동일하게 붙임) | - |
| `storage-stack.ts` 환경변수 계약(`AWS_REGION` 등) | 그대로 | - |
| App Runner Access Role | - | ECS Task Execution Role로 교체 (ECR pull + CloudWatch Logs) |
| App Runner Instance Role | - | ECS Task Role로 교체 (S3/SSM 권한 "정의"는 재사용, 붙이는 대상만 변경) |
| `ApprunnerService` 리소스 | - | `EcsTaskDefinition` + `EcsService`로 교체 |
| 헬스체크(`/api/health`, 포트 4000/3000) | 계약은 그대로 | ALB Target Group의 헬스체크 설정으로 이전 |
| `runtimeEnvironmentVariables`/`Secrets` | 계약(키 이름)은 그대로 | 태스크 정의의 `environment`/`secrets` 필드로 이전 |
| 네트워크 | `network-stack.ts`의 VPC/private 서브넷 2개는 RDS 접근용으로 그대로 재사용 | **신규 필요**: ALB가 붙을 Public 서브넷 + Internet Gateway + ALB용 보안그룹 추가 (기존 private 서브넷만으로는 ALB를 못 둔다) |
| 비용 구조 | - | ALB 시간당 고정비(~$16/월) + NAT Gateway(퍼블릭 서브넷만 쓰면 회피 가능) 추가 발생 |
| `frontend-stack`의 `NEXT_PUBLIC_API_URL` cross-stack reference | 참조하는 값의 "의미"는 그대로 | 참조 대상이 `ApprunnerService.serviceUrl`에서 ALB의 DNS name으로 변경 |

전환은 인터뷰 어필 관점에서 "직접 VPC/ALB/태스크 정의를 설계해본 경험"을 보여줄 수 있는 반면,
개인 프로젝트 트래픽 규모에서는 ALB 고정비가 App Runner보다 비싸질 수 있다. 실제 전환 여부는
트래픽/포트폴리오 목적에 따라 별도로 논의한다 (CLAUDE.md의 "사용자 가치 > 기술적 흥미" 원칙).

## 비용 관련 참고사항

시간당 고정 비용이 드는 리소스(NAT Gateway, Multi-AZ RDS, ALB 등)는 의도적으로 만들지 않았다.
App Runner도 트래픽에 비례해 과금되며 유휴 상태 최소 요금이 있다 (완전 종량제는 아님).

| 리소스 | 프리티어 | 프리티어 밖 예상 비용 (개인 프로젝트 트래픽 기준) |
| --- | --- | --- |
| S3 (Standard) | 5GB 저장 / 20,000 GET / 2,000 PUT (12개월) | 스토리지 $0.023/GB, 요청 비용은 미미한 수준 |
| CloudFront | 1TB 아웃바운드 + 1,000만 요청 (12개월, 계정 단위) | `PriceClass_100` 기준 GB당 약 $0.085 (아웃바운드) |
| DynamoDB (lock 테이블) | 25GB + 온디맨드 소량은 사실상 무료 | LockID 1건짜리 테이블이라 사실상 $0에 수렴 |
| IAM (User/Role/Policy) | 항상 무료 | $0 |
| ECR | 프라이빗 저장소 500MB (12개월) | $0.10/GB-월. lifecycle policy로 이미지 최근 10개만 유지해 무한 누적 방지 |
| App Runner (0.25 vCPU / 0.5 GB, 서비스 2개) | 프리티어 없음 | vCPU $0.064/vCPU-시간 + 메모리 $0.007/GB-시간. 서비스 2개를 상시 idle로만 켜둬도 월 약 $10~15 수준 (트래픽 없을 때도 최소 컴퓨트 요금 발생 — 완전 무료 유휴는 아님) |
| RDS (`db.t4g.micro`, Single-AZ, gp3 20GB) | 프리티어 있음 — `db.t4g.micro`(또는 `db.t3.micro`) 월 750시간 + gp2/gp3 20GB 저장 (계정 생성 후 12개월) | 프리티어 종료 후: 인스턴스 시간당 약 $0.016(서울 리전 기준, 온디맨드) → 월 약 $12, gp3 스토리지 $0.092/GB-월(20GB 기준 약 $1.8/월), 백업 스토리지(할당량 초과분)는 별도 과금 |
| VPC / 서브넷 / 보안그룹 (`network-stack`) | 항상 무료 | $0 (NAT Gateway/IGW를 만들지 않았으므로 시간당 고정비 없음) |
| App Runner VPC Connector | 항상 무료 (Connector 자체 요금 없음) | $0 (App Runner가 이 Connector를 통해 만드는 ENI에도 별도 요금이 없다) |

개인 프로젝트 규모에서는 프리티어 기간 중 월 10~20달러, 프리티어 종료 후에는 RDS 인스턴스/스토리지
비용이 더해져 월 25~35달러 내외로 예상한다 (App Runner 두 서비스 + RDS Single-AZ 기준). 트래픽이
거의 없는 개발/포트폴리오용 환경이라면 사용하지 않을 때 `cdktf destroy petlog-backend-dev`/
`petlog-frontend-dev`로 내렸다가 필요할 때 다시 `deploy`하는 것도 고려할 수 있다 (ECR 이미지는
registry-stack에 그대로 남아있으므로 재배포가 빠르다). RDS는 destroy 시 dev 환경에서는
`skipFinalSnapshot: true`라 즉시 삭제되지만(재생성 시 데이터가 없는 새 DB로 시작), prod는 최종
스냅샷을 남기고 삭제된다. 버킷에는 `S3BucketLifecycleConfiguration`으로 미완료 멀티파트 업로드(7일
후) 및 오래된 버전 객체(30일 후) 자동 정리 규칙을 걸어 스토리지 비용이 무한정 쌓이지 않게 했다.

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
