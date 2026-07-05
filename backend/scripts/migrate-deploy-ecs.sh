#!/usr/bin/env bash
# RDS(private, VPC 내부)에 Prisma 마이그레이션을 적용한다.
#
# RDS는 private 서브넷에 있어 로컬에서 직접 접근할 수 없다. 대신 이미 떠 있는
# backend ECS 태스크와 동일한 네트워크/보안그룹으로 "일회성 태스크"를 띄우고,
# 컨테이너 커맨드를 `npx prisma migrate deploy`로 오버라이드해서 그 안에서 실행한다.
# 프로덕션 이미지는 devDependencies(prisma CLI)를 prune해서 가볍게 유지하므로,
# npx가 그때그때 필요한 버전을 받아온다(이 태스크는 인터넷 접근이 되는 public
# 서브넷에 있으므로 npm 레지스트리에서 받아올 수 있다).
#
# 서브넷/보안그룹 ID는 하드코딩하지 않고 network-stack의 Terraform output에서
# 매번 조회한다 — 인프라가 재생성돼 ID가 바뀌어도 이 스크립트는 계속 동작한다.
set -euo pipefail

ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../infra" && pwd)"
NETWORK_STACK_DIR="${INFRA_DIR}/cdktf.out/stacks/petlog-network-${ENV}"

if [ ! -d "$NETWORK_STACK_DIR" ]; then
  echo "network-stack이 synth되어 있지 않습니다. 'cd infra && npx cdktf synth'를 먼저 실행하세요." >&2
  exit 1
fi

SUBNET_IDS=$(terraform -chdir="$NETWORK_STACK_DIR" output -json public_subnet_ids | tr -d '[]"\n ')
SECURITY_GROUP_ID=$(terraform -chdir="$NETWORK_STACK_DIR" output -raw ecs_task_security_group_id)

echo "==> public 서브넷: ${SUBNET_IDS}"
echo "==> 보안그룹: ${SECURITY_GROUP_ID}"
echo "==> petlog-backend-${ENV} 태스크 정의로 마이그레이션 태스크 실행"

# node:22-alpine 런타임 이미지에는 OpenSSL이 없어서, npx로 받은 prisma CLI의 스키마/마이그레이션
# 엔진이 OpenSSL 버전 감지에 실패하고 "not valid JSON" 에러로 죽는다 (앱이 이미 쓰는 쿼리 엔진은
# 빌드 시점에 생성돼 있어 영향 없다). apk add openssl로 먼저 설치한 뒤 마이그레이션을 실행한다.
TASK_ARN=$(aws ecs run-task \
  --region "$REGION" \
  --cluster "petlog-cluster-${ENV}" \
  --task-definition "petlog-backend-${ENV}" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["sh","-c","apk add --no-cache openssl && npx --yes prisma@6.0.0 migrate deploy --schema=backend/prisma/schema.prisma"]}]}' \
  --query 'tasks[0].taskArn' --output text)

echo "==> 태스크 시작: ${TASK_ARN}"
echo "==> 완료 대기 중..."
aws ecs wait tasks-stopped --region "$REGION" --cluster "petlog-cluster-${ENV}" --tasks "$TASK_ARN"

EXIT_CODE=$(aws ecs describe-tasks --region "$REGION" --cluster "petlog-cluster-${ENV}" --tasks "$TASK_ARN" \
  --query 'tasks[0].containers[0].exitCode' --output text)

TASK_ID="${TASK_ARN##*/}"
LOG_STREAM="backend/backend/${TASK_ID}"

echo "==> 종료 코드: ${EXIT_CODE}"
echo "==> 로그:"
aws logs get-log-events --region "$REGION" --log-group-name "/ecs/petlog-backend-${ENV}" \
  --log-stream-name "$LOG_STREAM" --query 'events[].message' --output text

if [ "$EXIT_CODE" != "0" ]; then
  echo "==> 마이그레이션 실패 (종료 코드 ${EXIT_CODE})" >&2
  exit 1
fi

echo "==> 마이그레이션 완료"
