#!/usr/bin/env bash
# 애플리케이션 전용 DB 롤(petlog_app / petlog_migrator)을 생성하고, 각각의 접속 URL을
# SSM SecureString에 저장한다. 실제 SQL은 `infra/bootstrap/db-roles.sql`에 있다.
#
# ## 왜 ECS 일회성 태스크로 실행하는가
# RDS는 private 서브넷에 있어(`publiclyAccessible: false`) 로컬에서 직접 붙을 수 없다.
# bastion 터널을 열어 psql로 실행할 수도 있지만, 그러면 로컬에 psql이 있어야 하고 실행
# 환경이 개발자 머신에 고정된다. 대신 `backend/scripts/migrate-deploy-ecs.sh`가 이미
# 검증한 패턴을 그대로 쓴다 — VPC 안에 일회성 Fargate 태스크를 띄워 그 안에서 실행한다.
#
# ## 비밀번호가 어디에도 평문으로 남지 않는 이유
# 비밀번호를 로컬에서 만들어 태스크로 넘기면 `ecs run-task`의 요청 파라미터로 CloudTrail에
# 기록된다(컨테이너 오버라이드의 environment는 평문이다). 그래서 비밀번호는 **태스크 안에서**
# 생성하고, 태스크가 직접 SSM에 저장한다. 이 스크립트는 비밀번호를 보지 못한다.
#
# ## 왜 IaC(terraform postgresql provider)가 아닌가
# provider를 쓰려면 plan/apply 때마다 DB에 TCP로 붙어야 해서 bastion 터널이 상시 전제가 되고
# (CI 불가), provider 인증에 마스터 비밀번호가 필요해 로테이션 결합이 되살아나며, 생성한
# 비밀번호가 terraform state에 평문으로 남는다. DB 롤은 "IaC를 돌리기 전에 있어야 하는 것"
# 이라 `infra/bootstrap/`(배포용 IAM 사용자 정책이 있는 곳)과 같은 성격의 부트스트랩이다.
#
# ## 멱등성
# 여러 번 실행해도 안전하다. 실행할 때마다 비밀번호가 새로 생성되어 DB와 SSM 양쪽에
# 동시에 반영되므로, 자격증명을 수동 로테이션하고 싶을 때도 이 스크립트를 다시 돌리면 된다.
# 단, 실행 후에는 ECS 서비스를 강제 재배포해야 새 값이 컨테이너에 주입된다.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# db-tunnel.sh / db-credentials.sh와 동일하게, 이 스크립트가 직접 호출하는 aws CLI를 위해
# .env를 셸 환경에 실어준다 (cdktf와 달리 CLI는 dotenv 자동 로드가 없다).
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
CLUSTER="petlog-cluster-${ENV}"
TASK_DEF="petlog-db-bootstrap-${ENV}"
BACKEND_SERVICE="petlog-backend-${ENV}"
SQL_FILE="bootstrap/db-roles.sql"

APP_PARAM="/petlog/${ENV}/backend/database-url-app"
MIGRATOR_PARAM="/petlog/${ENV}/backend/database-url-migrator"

if [ ! -f "$SQL_FILE" ]; then
  echo "${SQL_FILE}을 찾을 수 없습니다." >&2
  exit 1
fi

if ! aws ecs describe-task-definition --region "$REGION" --task-definition "$TASK_DEF" >/dev/null 2>&1; then
  echo "태스크 정의 ${TASK_DEF}이 없습니다." >&2
  echo "먼저 'cd infra && npx cdktf deploy petlog-backend-${ENV}'로 배포하세요." >&2
  exit 1
fi

# 부트스트랩 태스크는 마스터 자격증명으로 DB에 붙는다. 그런데 마스터 비밀번호는 7일마다
# 로테이션되는 반면 SSM의 마스터 파라미터는 `cdktf deploy` 시점에만 갱신되므로, 마지막 배포
# 이후 로테이션이 돌았다면 stale하다. 태스크를 띄우기 직전에 Secrets Manager의 현재 값으로
# 덮어써서 그 창을 닫는다.
#
# `refresh-database-url-ssm.sh`와 같은 일을 하지만 terraform output(cdktf.out)에 의존하지
# 않고 AWS API만 쓴다 — 이 스크립트 하나로 완결되게 하려는 의도다.
echo "==> 마스터 자격증명 동기화"
MASTER_SECRET_ARN="$(aws rds describe-db-instances --region "$REGION" \
  --db-instance-identifier "petlog-db-${ENV}" \
  --query 'DBInstances[0].MasterUserSecret.SecretArn' --output text)"
MASTER_SECRET_JSON="$(aws secretsmanager get-secret-value --region "$REGION" \
  --secret-id "$MASTER_SECRET_ARN" --query SecretString --output text)"
MASTER_ENDPOINT="$(aws rds describe-db-instances --region "$REGION" \
  --db-instance-identifier "petlog-db-${ENV}" \
  --query 'DBInstances[0].Endpoint.Address' --output text)"

MASTER_USERNAME="$(echo "$MASTER_SECRET_JSON" | jq -r .username)"
MASTER_PASSWORD="$(echo "$MASTER_SECRET_JSON" | jq -r .password)"

# AWS가 생성하는 마스터 비밀번호는 `@`, `:`, `/`를 포함할 수 있어 반드시 percent-encoding한다
# (그냥 이어 붙이면 `@`가 여러 번 나타나 연결 문자열 파싱이 깨진다).
ENCODED_MASTER_USERNAME="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$MASTER_USERNAME")"
ENCODED_MASTER_PASSWORD="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$MASTER_PASSWORD")"

aws ssm put-parameter --region "$REGION" \
  --name "/petlog/${ENV}/backend/database-url" \
  --type SecureString \
  --value "postgresql://${ENCODED_MASTER_USERNAME}:${ENCODED_MASTER_PASSWORD}@${MASTER_ENDPOINT}:5432/petlog" \
  --overwrite >/dev/null

# 네트워크 구성(서브넷/보안그룹)은 이미 떠 있는 backend 서비스에서 그대로 가져온다.
# terraform output에 의존하지 않으므로 cdktf.out이 없는 워크트리에서도 동작하고,
# "backend가 붙을 수 있는 곳이면 이 태스크도 붙을 수 있다"는 보장이 자연스럽게 성립한다.
echo "==> 네트워크 구성 조회 (${BACKEND_SERVICE})"
NETWORK_JSON="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" \
  --services "$BACKEND_SERVICE" \
  --query 'services[0].networkConfiguration.awsvpcConfiguration' --output json)"

SUBNETS="$(echo "$NETWORK_JSON" | jq -r '.subnets | join(",")')"
SECURITY_GROUPS="$(echo "$NETWORK_JSON" | jq -r '.securityGroups | join(",")')"

if [ -z "$SUBNETS" ] || [ "$SUBNETS" = "null" ]; then
  echo "backend 서비스의 네트워크 구성을 읽지 못했습니다." >&2
  exit 1
fi

echo "    서브넷: ${SUBNETS}"
echo "    보안그룹: ${SECURITY_GROUPS}"

# SQL은 비밀번호를 담고 있지 않으므로 환경변수로 넘겨도 안전하다. base64로 인코딩해
# JSON/셸 인용 문제를 원천 차단한다.
#
# gzip을 먼저 거치는 이유: RunTask의 컨테이너 오버라이드는 8192바이트가 상한인데, 이 SQL은
# 한글 주석이 많아(UTF-8에서 한 글자 3바이트) base64만 하면 8584바이트로 상한을 넘겼다.
# gzip -9를 태우면 3688바이트로 줄어 여유가 생긴다. 컨테이너의 busybox가 gunzip을 제공한다.
SQL_GZ_B64="$(gzip -9 -c "$SQL_FILE" | base64 | tr -d '\n')"

# 컨테이너 안에서 실행할 명령.
# - psql: node:22-alpine에는 없으므로 apk로 설치한다. Alpine 버전에 따라 패키지 이름이
#   postgresql16-client / postgresql-client로 갈리므로 둘 다 시도한다.
# - 비밀번호 생성: openssl도 이미지에 없다. 이미 있는 node의 crypto를 쓴다.
#   hex로 만들어 `@`, `:`, `/` 같은 문자가 아예 나오지 않게 한다 — 연결 문자열에
#   percent-encoding 없이 그대로 이어 붙일 수 있어 인코딩 실수 여지가 사라진다.
CONTAINER_COMMAND=$(cat <<'INNER'
set -eu
echo "==> psql / aws-cli 설치"
apk add --no-cache postgresql16-client aws-cli >/dev/null 2>&1 \
  || apk add --no-cache postgresql-client aws-cli >/dev/null

echo "==> 비밀번호 생성"
APP_PW="$(node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("hex"))')"
MIGRATOR_PW="$(node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("hex"))')"

echo "==> SQL 적용"
echo "$SQL_GZ_B64" | base64 -d | gunzip > /tmp/db-roles.sql
psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -v app_password="$APP_PW" \
  -v migrator_password="$MIGRATOR_PW" \
  -f /tmp/db-roles.sql

# 마스터 URL에서 자격증명 부분만 갈아끼워 host:port/db를 그대로 재사용한다.
HOST_PART="${DATABASE_URL#*@}"

echo "==> SSM 저장"
aws ssm put-parameter --name "$APP_PARAM" --type SecureString --overwrite \
  --value "postgresql://petlog_app:${APP_PW}@${HOST_PART}" >/dev/null
aws ssm put-parameter --name "$MIGRATOR_PARAM" --type SecureString --overwrite \
  --value "postgresql://petlog_migrator:${MIGRATOR_PW}@${HOST_PART}" >/dev/null

echo "BOOTSTRAP_OK"
INNER
)

OVERRIDES="$(jq -cn \
  --arg cmd "$CONTAINER_COMMAND" \
  --arg sql "$SQL_GZ_B64" \
  --arg appParam "$APP_PARAM" \
  --arg migratorParam "$MIGRATOR_PARAM" \
  '{
     containerOverrides: [{
       name: "bootstrap",
       command: ["sh", "-c", $cmd],
       environment: [
         { name: "SQL_GZ_B64",      value: $sql },
         { name: "APP_PARAM",       value: $appParam },
         { name: "MIGRATOR_PARAM",  value: $migratorParam }
       ]
     }]
   }')"

# AWS가 돌려주는 InvalidParameterException은 실제 크기를 알려주지 않아 원인 파악이 느리다.
# 여기서 미리 재서 몇 바이트인지 함께 알려준다 (SQL 주석이 늘면 다시 걸릴 수 있는 지점이다).
OVERRIDES_BYTES="$(printf '%s' "$OVERRIDES" | wc -c | tr -d ' ')"
if [ "$OVERRIDES_BYTES" -gt 8192 ]; then
  echo "컨테이너 오버라이드가 ${OVERRIDES_BYTES}바이트로 AWS 상한(8192)을 넘습니다." >&2
  echo "${SQL_FILE}의 주석을 줄이거나, SQL을 S3에 올려 태스크가 내려받는 방식으로 바꾸세요." >&2
  exit 1
fi

echo "==> 부트스트랩 태스크 실행 (${TASK_DEF}, 오버라이드 ${OVERRIDES_BYTES}바이트)"
TASK_ARN="$(aws ecs run-task \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_DEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SECURITY_GROUPS}],assignPublicIp=ENABLED}" \
  --overrides "$OVERRIDES" \
  --query 'tasks[0].taskArn' --output text)"

echo "    태스크: ${TASK_ARN}"
echo "==> 완료 대기 중..."
aws ecs wait tasks-stopped --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN"

EXIT_CODE="$(aws ecs describe-tasks --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query 'tasks[0].containers[0].exitCode' --output text)"

TASK_ID="${TASK_ARN##*/}"
echo "==> 종료 코드: ${EXIT_CODE}"
echo "==> 로그:"
aws logs get-log-events --region "$REGION" \
  --log-group-name "/ecs/petlog-db-bootstrap-${ENV}" \
  --log-stream-name "bootstrap/bootstrap/${TASK_ID}" \
  --query 'events[].message' --output text 2>/dev/null || echo "    (로그를 아직 읽을 수 없습니다)"

if [ "$EXIT_CODE" != "0" ]; then
  echo "==> 부트스트랩 실패 (종료 코드 ${EXIT_CODE})" >&2
  exit 1
fi

echo
echo "==> 완료. 생성된 SSM 파라미터:"
echo "    ${APP_PARAM}       (백엔드 런타임)"
echo "    ${MIGRATOR_PARAM}  (prisma migrate deploy)"
echo
echo "다음 단계: 백엔드 태스크를 강제 재배포해 새 자격증명을 주입하세요."
echo "    npm run deploy:ecs-force-redeploy --workspace=backend"
