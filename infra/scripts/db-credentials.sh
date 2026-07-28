#!/usr/bin/env bash
# pgAdmin4 접속에 필요한 DB 자격증명을 한 번에 출력한다.
#
# 이 DB에는 세 개의 롤이 있다 (infra/bootstrap/db-roles.sql 참고).
#   - petlog          : RDS 마스터. AWS가 7일마다 로테이션한다. 관리 작업용.
#   - petlog_migrator : 스키마 객체 소유 + DDL. prisma migrate deploy가 쓴다.
#   - petlog_app      : DML만. 백엔드 런타임이 쓴다.
#
# 마스터는 Secrets Manager에서, 나머지 둘은 부트스트랩이 저장한 SSM SecureString에서 읽는다.
#
# 사용법: db-credentials.sh [master|app|migrator]
#   인자로 지정한 롤의 비밀번호를 macOS 클립보드(pbcopy)로 복사한다(기본값: master).
#   터미널 히스토리에 남지 않게 하려는 것이므로, 셋 다 화면에는 출력된다.
#
# ## 권한 문제를 재현하려면 petlog_app으로 붙어라
# 마스터로 붙으면 무엇이든 되기 때문에 "앱만 못 읽는" 권한 누락(예: 새 테이블에
# ALTER DEFAULT PRIVILEGES가 안 걸린 경우)이 드러나지 않는다. 앱 관점의 문제를 확인할
# 때는 반드시 petlog_app으로 접속한다.
#
# ## 마스터로 객체를 만들지 마라
# pgAdmin에서 마스터로 테이블을 만들면 소유자가 마스터가 되고, ALTER DEFAULT PRIVILEGES는
# migrator가 만든 객체에만 적용되므로 petlog_app이 그 테이블에 접근하지 못한다. 스키마
# 변경은 반드시 prisma 마이그레이션으로 한다.
#
# 전제: database-stack이 이미 배포되어 cdktf.out에 output이 남아 있어야 한다.
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
echo
echo "[master]    $DB_USERNAME / $DB_PASSWORD"

# 애플리케이션 롤 자격증명은 부트스트랩 태스크가 SSM SecureString에 저장한 접속 URL 안에
# 들어 있다. 부트스트랩 전이라면 파라미터가 없으므로 조용히 안내만 하고 넘어간다.
read_role_url() {
  aws ssm get-parameter \
    --name "/petlog/${ENV}/backend/$1" \
    --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || true
}

# postgresql://<user>:<password>@<host>:<port>/<db> → "<user> <password>"
split_credentials() {
  local credentials="${1#postgresql://}"
  credentials="${credentials%%@*}"
  printf '%s %s' "${credentials%%:*}" "${credentials#*:}"
}

APP_USERNAME=''
APP_PASSWORD=''
MIGRATOR_USERNAME=''
MIGRATOR_PASSWORD=''

APP_URL="$(read_role_url database-url-app)"
MIGRATOR_URL="$(read_role_url database-url-migrator)"

BOOTSTRAP_HINT='(아직 없음 — npm run db:bootstrap-roles 실행 전)'

if [ -n "$APP_URL" ]; then
  read -r APP_USERNAME APP_PASSWORD <<<"$(split_credentials "$APP_URL")"
  echo "[app]       $APP_USERNAME / $APP_PASSWORD"
else
  echo "[app]       $BOOTSTRAP_HINT"
fi

if [ -n "$MIGRATOR_URL" ]; then
  read -r MIGRATOR_USERNAME MIGRATOR_PASSWORD <<<"$(split_credentials "$MIGRATOR_URL")"
  echo "[migrator]  $MIGRATOR_USERNAME / $MIGRATOR_PASSWORD"
else
  echo "[migrator]  $BOOTSTRAP_HINT"
fi

# 클립보드에 넣을 대상은 인자로 고른다 (기본값은 기존 동작 유지 = master).
COPY_TARGET="${1:-master}"
case "$COPY_TARGET" in
  master)   COPY_PASSWORD="$DB_PASSWORD" ;;
  app)      COPY_PASSWORD="$APP_PASSWORD" ;;
  migrator) COPY_PASSWORD="$MIGRATOR_PASSWORD" ;;
  *)
    echo "알 수 없는 대상: ${COPY_TARGET} (master|app|migrator 중 하나)" >&2
    exit 1
    ;;
esac

if [ -z "$COPY_PASSWORD" ]; then
  echo
  echo "(${COPY_TARGET} 자격증명이 아직 없어 클립보드 복사를 건너뜁니다)"
  exit 0
fi

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$COPY_PASSWORD" | pbcopy
  echo
  echo "(${COPY_TARGET} Password를 클립보드에 복사했습니다)"
fi
