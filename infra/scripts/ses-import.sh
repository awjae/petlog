#!/usr/bin/env bash
# 콘솔에서 DNS 검증을 마친 SES 도메인 Identity를 Terraform state로 편입한다 (환경당 1회).
#
# 왜 필요한가: DNS가 Porkbun에 있고 Route53 Hosted Zone이 없어서(.claude/docs/decisions/
# 021-custom-domain-petlog-quest.md), DKIM CNAME 등록 = 도메인 소유권 검증을 CDKTF가 대신할
# 수 없다. 그래서 Identity는 사람이 콘솔에서 만들고, 이 스크립트가 "AWS에 있는 실물"을
# Terraform 장부에 등록해준다. Terraform은 state와 코드만 비교하므로, 이 등록이 없으면
# 없는 줄 알고 create를 시도하다 AlreadyExists로 apply가 깨진다.
#
# 왜 코드(importFrom)로 박지 않는가: import 블록은 "이미 존재함"을 전제하므로, 실물이 없는
# 새 계정에서는 오히려 배포가 실패한다. 재현성을 해치지 않도록 1회성 절차로 분리한다.
#
# 도메인은 인자로 받지 않는다 — infra/.env의 TF_VAR_mail_from_domain이 단일 정보 소스이고,
# 같은 값을 명령어에 다시 적으면 어긋날 수 있다 (018-deploy-script-consolidation.md와 동일한 원칙).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# cdktf(main.ts)는 dotenv로 .env를 자동 로드하지만, 이 스크립트가 직접 부르는 terraform CLI는
# 그렇지 않다 — 여기서 명시적으로 .env를 셸 환경에 실어준다 (db-credentials.sh와 동일).
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ENV="${PETLOG_ENV:-dev}"
STACK="petlog-backend-${ENV}"
STACK_DIR="cdktf.out/stacks/${STACK}"

# backend-stack.ts의 Sesv2EmailIdentity construct id와 같아야 한다. 아래에서 실제 synth
# 결과와 대조해 검증하므로, construct id를 바꾸면 이 스크립트가 즉시 실패하며 알려준다.
RESOURCE_ADDR="aws_sesv2_email_identity.mail-domain-identity"

DOMAIN="${TF_VAR_mail_from_domain:-}"
if [ -z "$DOMAIN" ]; then
  echo "TF_VAR_mail_from_domain이 비어 있습니다." >&2
  echo "infra/.env에 SES에서 검증을 마친 발신 도메인을 채우세요 (infra/.env.example 참고)." >&2
  exit 1
fi

# state/코드 대조는 synth 결과 기준이므로, 오래된 cdktf.out으로 import하지 않도록 갱신한다.
echo "▸ synth (${STACK})"
npx cdktf synth > /dev/null

if [ ! -d "$STACK_DIR" ]; then
  echo "synth 결과에 ${STACK}이 없습니다: ${STACK_DIR}" >&2
  exit 1
fi

# construct id가 바뀌어 주소가 달라졌는데 스크립트만 예전 값을 들고 있는 상황을 막는다.
if ! grep -q '"mail-domain-identity"' "${STACK_DIR}/cdk.tf.json"; then
  echo "synth 결과에서 ${RESOURCE_ADDR}를 찾지 못했습니다." >&2
  echo "backend-stack.ts의 Sesv2EmailIdentity construct id가 바뀌었다면 이 스크립트도 함께 고치세요." >&2
  exit 1
fi

echo "▸ terraform init (원격 state 연결)"
terraform -chdir="$STACK_DIR" init -input=false > /dev/null

# 이미 편입돼 있으면 아무 것도 하지 않는다 — 재실행해도 안전하게(멱등) 만든다.
if terraform -chdir="$STACK_DIR" state list 2>/dev/null | grep -qx "$RESOURCE_ADDR"; then
  echo "✓ 이미 state에 있습니다: ${RESOURCE_ADDR} — 할 일이 없습니다."
  exit 0
fi

echo "▸ import: ${RESOURCE_ADDR} ← ${DOMAIN}"
terraform -chdir="$STACK_DIR" import -input=false "$RESOURCE_ADDR" "$DOMAIN"

echo
echo "✓ 완료. 이제 diff에서 create 계획이 사라졌는지 확인한 뒤 배포하세요:"
echo "    npm run diff:all"
