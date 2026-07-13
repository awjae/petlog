#!/usr/bin/env bash
# RDS 관리형 마스터 비밀번호(manageMasterUserPassword)는 AWS가 7일 주기로 자동
# 로테이션한다. backend-stack.ts는 배포(cdktf deploy) 시점에 그 비밀번호를 한 번 읽어
# DATABASE_URL로 조립해 SSM SecureString에 저장하고, ECS는 그 SSM 값만 읽는다. 로테이션이
# 돌면 SSM 값이 stale해져 백엔드가 "Authentication failed"로 죽는 장애가 있었다
# (2026-07-13). infra 코드를 바꿔 cdktf deploy를 매번 요구하는 대신, backend를 배포할
# 때마다(= `npm run deploy`) 이 스크립트가 Secrets Manager에서 현재 비밀번호를 다시 읽어
# SSM DATABASE_URL을 덮어쓴다 — 배포가 뜸해서 로테이션 주기(7일)보다 오래 배포가 없으면
# 다시 stale해질 수 있는 완화책이지, 구조적으로 로테이션을 무력화하는 해결책은 아니다.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
DATABASE_STACK_DIR="cdktf.out/stacks/petlog-database-${ENV}"

if [ ! -d "$DATABASE_STACK_DIR" ]; then
  echo "database-stack이 synth되어 있지 않습니다. 'cd infra && npx cdktf synth petlog-database-${ENV}'를 먼저 실행하세요." >&2
  exit 1
fi

SECRET_ARN="$(terraform -chdir="$DATABASE_STACK_DIR" output -raw db_master_user_secret_arn)"
DB_ADDRESS="$(terraform -chdir="$DATABASE_STACK_DIR" output -raw db_address)"
DB_NAME="$(terraform -chdir="$DATABASE_STACK_DIR" output -raw db_name)"

SECRET_JSON="$(aws secretsmanager get-secret-value --region "$REGION" --secret-id "$SECRET_ARN" --query SecretString --output text)"
DB_USERNAME="$(echo "$SECRET_JSON" | jq -r .username)"
DB_PASSWORD="$(echo "$SECRET_JSON" | jq -r .password)"

# RDS가 자동 생성하는 비밀번호는 `@`, `:`, `/` 같은 특수문자를 포함할 수 있으므로 반드시
# percent-encoding한다 — 그대로 이어 붙이면 연결 문자열 파싱이 깨진다.
ENCODED_USERNAME="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$DB_USERNAME")"
ENCODED_PASSWORD="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$DB_PASSWORD")"

DATABASE_URL="postgresql://${ENCODED_USERNAME}:${ENCODED_PASSWORD}@${DB_ADDRESS}:5432/${DB_NAME}"

aws ssm put-parameter --region "$REGION" \
  --name "/petlog/${ENV}/backend/database-url" \
  --type SecureString \
  --value "$DATABASE_URL" \
  --overwrite >/dev/null

echo "==> SSM /petlog/${ENV}/backend/database-url 을 RDS 현재 마스터 비밀번호로 갱신했습니다."
