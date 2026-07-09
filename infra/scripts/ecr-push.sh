#!/usr/bin/env bash
# 로컬 이미지를 ECR에 :latest와 :<package.json version> 두 태그로 푸시한다.
# 버전 태그를 남겨 ECR 자체가 "어떤 버전이 언제 올라갔는지"의 근거가 되게 한다
# (check-version-not-deployed.sh가 이 버전 태그를 기준으로 중복 배포를 막는다).
#
# 호출부(backend/frontend package.json)가 각 워크스페이스 루트에서 실행하므로
# ./package.json을 그대로 읽는다.
set -euo pipefail

LOCAL_IMAGE="$1" # 예: petlog-backend
REPO_PREFIX="$2" # 예: petlog-backend
ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
VERSION="$(node -p "require('./package.json').version")"
REMOTE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_PREFIX}-${ENV}"

docker tag "${LOCAL_IMAGE}:latest" "${REMOTE}:latest"
docker tag "${LOCAL_IMAGE}:latest" "${REMOTE}:${VERSION}"
docker push "${REMOTE}:latest"
docker push "${REMOTE}:${VERSION}"
