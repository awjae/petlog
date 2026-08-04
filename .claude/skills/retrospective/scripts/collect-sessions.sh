#!/usr/bin/env bash
# 대화 세션 단위로 사용자 발화를 추출한다.
#
# 사용법: collect-sessions.sh [일수] [프로젝트경로]
#   일수       기본 7. 최근 며칠 내 세션을 볼지.
#   프로젝트경로 생략하면 모든 프로젝트의 세션을 본다.
#              특정 프로젝트로 좁히려면 경로를 준다. "." 은 현재 디렉토리.
#
# 출력: 세션 하나가 한 블록. 제목 / 작업한 프로젝트 / 기록 파일 / 사용자 발화.
#       발화의 앞뒤 맥락(Claude가 뭘 했길래 그런 말을 했는지)이 필요하면
#       출력된 기록 파일을 직접 조회한다.

set -euo pipefail

DAYS="${1:-7}"
SCOPE="${2:-}"
ROOT="$HOME/.claude/projects"

command -v jq >/dev/null || { echo "jq가 필요하다" >&2; exit 1; }
[ -d "$ROOT" ] || { echo "세션 기록 디렉토리가 없다: $ROOT" >&2; exit 1; }

# 프로젝트 경로는 / 와 . 을 - 로 바꾼 이름으로 저장된다.
# 하위 디렉토리나 worktree에서 연 세션은 별도 디렉토리가 되므로 prefix로 함께 찾는다.
if [ -n "$SCOPE" ]; then
  [ "$SCOPE" = "." ] && SCOPE="$PWD"
  prefix=$(printf '%s' "${SCOPE%/}" | sed 's/[/.]/-/g')
  dirs=("$ROOT/$prefix"*/)
else
  dirs=("$ROOT"/*/)
fi

found=0
for dir in "${dirs[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do
    [ -s "$f" ] || continue

    utterances=$(jq -r '
      select(.type == "user")
      | select(.isSidechain != true and .isMeta != true and (.toolUseResult | not))
      | .message.content
      | if type == "string" then . else (map(select(.type == "text").text) | join(" ")) end
      | select(type == "string")
      | gsub("\\s+"; " ")
      | select(test("^<(command-name|local-command|bash-input|task-notification|system-reminder|hook|ide)") | not)
      | select(length > 4)
      | .[0:400]
      | "> " + .
    ' "$f" 2>/dev/null) || continue

    # 발화가 없는 세션은 회고할 것이 없다.
    [ -n "$utterances" ] || continue

    # 깨진 라인이 섞인 기록이 있어도 세션 하나 때문에 전체가 멈추면 안 된다.
    title=$(jq -r 'select(.type == "ai-title") | .aiTitle' "$f" 2>/dev/null | head -1) || true
    cwd=$(jq -r 'select(.cwd) | .cwd' "$f" 2>/dev/null | head -1) || true
    when=$(jq -r 'select(.timestamp) | .timestamp' "$f" 2>/dev/null | tail -1 | cut -c1-16 | tr 'T' ' ') || true

    printf '=== [%s] %s\n' "${when:-시각미상}" "${title:-제목없음}"
    printf -- '--- 프로젝트: %s\n' "${cwd:-알수없음}"
    printf -- '--- 기록: %s\n' "$f"
    printf '%s\n\n' "$utterances"
    found=$((found + 1))
  done < <(find "$dir" -maxdepth 1 -name '*.jsonl' -mtime -"$DAYS" 2>/dev/null)
done

if [ "$found" -eq 0 ]; then
  echo "최근 ${DAYS}일 내 세션 기록이 없다${SCOPE:+ (범위: $SCOPE)}" >&2
  exit 2
fi

echo "총 ${found}개 세션${SCOPE:+ (범위: $SCOPE)}" >&2
