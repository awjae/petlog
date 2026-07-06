#!/usr/bin/env bash
# database-stack의 cdktf output(RDS 엔드포인트/시크릿 ARN)을 읽어 Secrets Manager에서
# 마스터 비밀번호를 꺼내고, pgAdmin4 접속에 필요한 정보를 한 번에 출력한다.
#
# 전제: database-stack이 이미 배포되어 cdktf.out에 output이 남아 있어야 한다.
# 비밀번호는 macOS 클립보드(pbcopy)로도 복사해준다(터미널 히스토리에 남지 않게).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# cdktf(main.ts)는 dotenv로 .env를 자동 로드하지만, 이 스크립트가 직접 부르는
# terraform/aws CLI는 그렇지 않다 — 여기서 명시적으로 .env를 셸 환경에 실어준다.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ENV="${PETLOG_ENV:-dev}"
STACK="petlog-database-${ENV}"
STACK_DIR="cdktf.out/stacks/${STACK}"

if [ ! -d "$STACK_DIR" ]; then
  echo "cdktf.out에 ${STACK} 출력이 없습니다. 먼저 'cdktf deploy ${STACK}'를 실행하세요." >&2
  exit 1
fi

SECRET_ARN="$(terraform -chdir="$STACK_DIR" output -raw db_master_user_secret_arn)"
DB_ADDRESS="$(terraform -chdir="$STACK_DIR" output -raw db_address)"
DB_NAME="$(terraform -chdir="$STACK_DIR" output -raw db_name)"

SECRET_JSON="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)"
DB_USERNAME="$(echo "$SECRET_JSON" | jq -r .username)"
DB_PASSWORD="$(echo "$SECRET_JSON" | jq -r .password)"

echo "Host:     $DB_ADDRESS"
echo "Port:     5432"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Password: $DB_PASSWORD"

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$DB_PASSWORD" | pbcopy
  echo
  echo "(Password는 클립보드에 복사했습니다)"
fi
