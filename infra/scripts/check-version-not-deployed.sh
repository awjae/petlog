#!/usr/bin/env bash
# 로컬 package.json의 version이 이미 ECR에 푸시된 태그인지 확인한다.
# "릴리즈 단위로 버전을 bump한다" 컨벤션을 강제하는 최소 안전장치 —
# 같은 버전 태그가 이미 있으면 bump를 깜빡한 것이므로 배포를 막는다.
#
# 호출부(backend/frontend package.json)가 각 워크스페이스 루트에서 실행하므로
# ./package.json을 그대로 읽는다.
set -euo pipefail

REPO_PREFIX="$1" # 예: petlog-backend
ENV="${PETLOG_ENV:-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
REPO="${REPO_PREFIX}-${ENV}"
VERSION="$(node -p "require('./package.json').version")"

if aws ecr describe-images --region "$REGION" --repository-name "$REPO" --image-ids imageTag="$VERSION" >/dev/null 2>&1; then
  echo "==> ${REPO}:${VERSION} 이 이미 ECR에 존재합니다." >&2
  echo "    package.json의 version을 bump한 뒤 다시 배포하세요 (현재: ${VERSION})." >&2
  exit 1
fi

echo "==> ${REPO}:${VERSION} — 신규 버전, 배포 진행"
