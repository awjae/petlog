#!/usr/bin/env bash
# infra 전체 스택을 upsert 방식으로 배포한다 (최초 배포/steady state 배포를 하나의 흐름으로 처리).
#
# - 스택 자체(cdktf deploy)는 terraform apply라 원래 upsert다: 없으면 만들고, 있으면 변경분만 반영한다.
# - 진짜 "최초 배포"에서만 발생하는 문제는 ECR에 이미지가 하나도 없어 backend-stack/frontend-stack의
#   EcsService가 뜨지 못하는 것뿐이다. 이 스크립트는 각 리포지토리에 `latest` 태그가 있는지
#   확인해서, 없을 때만 이미지를 빌드/push한다 — 있으면 건드리지 않는다(이미지 교체는
#   backend/frontend의 `npm run deploy` 몫).
# - App Runner에서 ECS Fargate + ALB로 전환하며 backend/frontend가 ALB 도메인 하나를 공유하게
#   됐다. 그래서 예전에 있던 "backend 2차 배포"(FRONTEND_URL ↔ NEXT_PUBLIC_API_URL 순환 의존
#   해결용) 단계가 사라졌다 — ALB는 backend-stack 배포가 끝나는 즉시 DNS 이름을 알 수 있으므로,
#   그 값을 그대로 backend의 FRONTEND_URL과 frontend 빌드용 NEXT_PUBLIC_API_URL 둘 다에 쓴다.
# - ALB 앞단에 CloudFront(HTTPS 종단)를 추가한 이후로는 ALB URL이 아니라 CloudFront URL을
#   FRONTEND_URL/NEXT_PUBLIC_API_URL에 쓴다 (`.claude/docs/decisions/020-cloudfront-https.md`
#   참고). ALB 보안그룹이 CloudFront 오리진 IP 대역만 허용하므로 ALB URL로는 어차피 직접
#   접속되지 않는다.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
REPO_ROOT="$(cd .. && pwd)"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY_HOST="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

BACKEND_STACK="petlog-backend-${ENV}"
FRONTEND_STACK="petlog-frontend-${ENV}"
BACKEND_REPO="petlog-backend-${ENV}"
FRONTEND_REPO="petlog-frontend-${ENV}"

image_exists() {
  aws ecr describe-images --region "$REGION" --repository-name "$1" --image-ids imageTag=latest >/dev/null 2>&1
}

echo "==> [1/5] registry / storage / network / database 스택 배포"
cdktf deploy "petlog-registry-${ENV}" "petlog-storage-${ENV}" "petlog-network-${ENV}" "petlog-database-${ENV}"

echo "==> [2/5] ECR 로그인"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY_HOST"

if ! image_exists "$BACKEND_REPO"; then
  echo "==> backend 이미지가 ECR에 없음 (최초 배포) — 이미지 빌드 & push"
  docker build -f "$REPO_ROOT/backend/Dockerfile" -t petlog-backend "$REPO_ROOT"
  docker tag petlog-backend:latest "${REGISTRY_HOST}/${BACKEND_REPO}:latest"
  docker push "${REGISTRY_HOST}/${BACKEND_REPO}:latest"
else
  echo "==> backend 이미지가 이미 존재 — 스킵 (이미지 교체는 npm run deploy --workspace=backend)"
fi

echo "==> [3/5] backend-stack 배포 (ECS 클러스터 + 공유 ALB + CloudFront + backend 서비스)"
cdktf deploy "$BACKEND_STACK" --ignore-missing-stack-dependencies

# CloudFront는 backend-stack 배포가 끝나는 즉시 도메인을 알 수 있다 (frontend-stack 배포를
# 기다릴 필요가 없다 — App Runner 시절의 2단계 배포가 더 이상 필요 없는 이유). frontend
# 빌드/런타임 모두 ALB URL이 아니라 이 CloudFront URL(HTTPS)을 참조한다.
CLOUDFRONT_URL="$(terraform -chdir="cdktf.out/stacks/${BACKEND_STACK}" output -raw cloudfront_url)"
echo "    CloudFront URL (backend + frontend 공유): ${CLOUDFRONT_URL}"

if ! image_exists "$FRONTEND_REPO"; then
  echo "==> frontend 이미지가 ECR에 없음 (최초 배포) — 이미지 빌드 & push (NEXT_PUBLIC_API_URL=${CLOUDFRONT_URL})"
  docker build -f "$REPO_ROOT/frontend/Dockerfile" --build-arg NEXT_PUBLIC_API_URL="$CLOUDFRONT_URL" -t petlog-frontend "$REPO_ROOT"
  docker tag petlog-frontend:latest "${REGISTRY_HOST}/${FRONTEND_REPO}:latest"
  docker push "${REGISTRY_HOST}/${FRONTEND_REPO}:latest"
else
  echo "==> frontend 이미지가 이미 존재 — 스킵 (이미지 교체는 npm run deploy --workspace=frontend)"
fi

echo "==> [4/5] frontend-stack 배포 (공유 ALB의 frontend 타겟 그룹에 ECS 서비스 등록)"
cdktf deploy "$FRONTEND_STACK" --ignore-missing-stack-dependencies

echo "==> [5/5] 완료"
echo "    접속 URL (backend /api/* + frontend 그 외 전부, 동일 CloudFront 도메인, HTTPS): ${CLOUDFRONT_URL}"
