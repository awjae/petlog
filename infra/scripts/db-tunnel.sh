#!/usr/bin/env bash
# bastion-stack의 EC2를 시작하고, SSM Session Manager 포트포워딩으로 로컬 포트를
# RDS(petlog-database-{env})의 5432로 연결한다. pgAdmin4는 localhost:$LOCAL_PORT로 접속하면 된다.
#
# Ctrl+C로 세션을 끊으면(EXIT trap) bastion 인스턴스를 자동으로 stop한다 — Client VPN처럼
# "켜둔 시간만큼 과금"되는 리소스가 아니지만, 안 쓸 때는 컴퓨트 요금이 전혀 없는 정지 상태로
# 돌아가는 게 기본이어야 한다는 원칙(bastion-stack.ts 참고)을 스크립트로 강제한다.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ENV="${PETLOG_ENV:-dev}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
BASTION_STACK_DIR="cdktf.out/stacks/petlog-bastion-${ENV}"
DATABASE_STACK_DIR="cdktf.out/stacks/petlog-database-${ENV}"

for dir in "$BASTION_STACK_DIR" "$DATABASE_STACK_DIR"; do
  if [ ! -d "$dir" ]; then
    echo "${dir}가 없습니다. 먼저 'cdktf deploy petlog-bastion-${ENV} petlog-database-${ENV}'를 실행하세요." >&2
    exit 1
  fi
done

INSTANCE_ID="$(terraform -chdir="$BASTION_STACK_DIR" output -raw bastion_instance_id)"
RDS_ADDRESS="$(terraform -chdir="$DATABASE_STACK_DIR" output -raw db_address)"

STATE="$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].State.Name' --output text)"

if [ "$STATE" != "running" ]; then
  echo "==> Bastion 인스턴스(${INSTANCE_ID}) 시작 중..."
  aws ec2 start-instances --instance-ids "$INSTANCE_ID" >/dev/null
  aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"
fi

echo "==> SSM 에이전트 등록 대기 중..."
until aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
  --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null | grep -q Online; do
  sleep 2
done

cleanup() {
  echo
  echo "==> Bastion 인스턴스(${INSTANCE_ID}) 정지 중..."
  aws ec2 stop-instances --instance-ids "$INSTANCE_ID" >/dev/null
}
trap cleanup EXIT

echo "==> 터널 연결: localhost:${LOCAL_PORT} -> ${RDS_ADDRESS}:5432"
echo "    pgAdmin4에서 Host=localhost, Port=${LOCAL_PORT}로 접속하세요. 끝나면 Ctrl+C."
aws ssm start-session \
  --target "$INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${RDS_ADDRESS}\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
