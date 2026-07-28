#!/usr/bin/env bash
# SSM의 **마스터** DATABASE_URL(`/petlog/{env}/backend/database-url`)을 Secrets Manager의
# 현재 마스터 비밀번호로 덮어쓴다.
#
# ## 역할이 바뀌었다 (더 이상 백엔드 배포 경로에 있지 않다)
# 원래 이 스크립트는 "로테이션 → SSM stale → 백엔드 Authentication failed" 장애의 완화책으로,
# backend를 배포할 때마다(`npm run deploy`) 실행됐다. 배포가 로테이션 주기(7일)보다 뜸하면
# 다시 stale해지는 임시방편이었고, 실제로 2026-07-27 로테이션 때 그대로 재발했다.
#
# 지금은 백엔드 런타임이 마스터가 아니라 `petlog_app` 롤로 접속한다(infra/bootstrap/db-roles.sql).
# 그 롤의 비밀번호는 AWS가 로테이션하지 않으므로 런타임은 애초에 stale해질 수 없고, 이 스크립트를
# 배포마다 돌릴 이유도 사라졌다 — backend의 `deploy:image` 체인에서 제거했다.
#
# 마스터 파라미터가 여전히 필요한 곳은 DB 롤 부트스트랩 태스크 하나뿐이며, 거기서 쓸 값은
# `infra/scripts/bootstrap-db-roles.sh`가 실행 직전에 스스로 동기화한다. 따라서 이 스크립트는
# 이제 수동 점검/긴급 복구용이다.
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
