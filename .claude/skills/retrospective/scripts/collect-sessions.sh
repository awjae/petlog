#!/usr/bin/env bash
# 대화 세션 단위로 사용자 발화를 추출한다.
#
# 사용법: collect-sessions.sh [일수] [프로젝트경로|all]
#   일수         기본 7. 최근 며칠 내 세션을 볼지.
#   프로젝트경로  기본 all(모든 프로젝트). 특정 저장소로 좁히려면 경로를 준다.
#                "." 은 현재 디렉토리. 경로가 git 저장소 안이면 저장소 루트로 올려서 찾는다.
#
# 출력: 세션 하나가 한 블록이며 오래된 것부터 나온다.
#       발화마다 직전 Claude 턴 요약(↳)과 발화 uuid 앞 8자가 붙는다.
#       원본 레코드가 필요하면:
#         jq -r 'select(.uuid | startswith("<uuid8>"))' <기록파일>

set -euo pipefail

DAYS="${1:-7}"
SCOPE="${2:-all}"
ROOT="$HOME/.claude/projects"

command -v jq >/dev/null || { echo "jq가 필요하다" >&2; exit 1; }
[ -d "$ROOT" ] || { echo "세션 기록 디렉토리가 없다: $ROOT" >&2; exit 1; }

case "$DAYS" in
  ''|*[!0-9]*) echo "일수는 숫자여야 한다: $DAYS" >&2; exit 1 ;;
esac

# --apply 같은 스킬 쪽 플래그가 흘러들어오면 경로로 해석돼 조용히 0건이 된다.
case "$SCOPE" in
  --*) echo "경로가 아닌 인자는 무시한다: $SCOPE" >&2; SCOPE="all" ;;
esac

# ISO8601(UTC) <-> epoch. BSD(macOS) 우선, 실패하면 GNU.
to_epoch() {
  date -j -u -f '%Y-%m-%dT%H:%M:%S' "$1" +%s 2>/dev/null \
    || date -u -d "$1" +%s 2>/dev/null
}
fmt_time() {
  date -r "$1" '+%Y-%m-%d %H:%M' 2>/dev/null \
    || date -d "@$1" '+%Y-%m-%d %H:%M' 2>/dev/null
}

# 프로젝트 경로는 / 와 . 을 - 로 바꾼 이름으로 저장된다.
# 하위 디렉토리나 worktree에서 연 세션은 별도 디렉토리가 되므로 prefix로 함께 찾는다.
if [ "$SCOPE" = "all" ] || [ -z "$SCOPE" ]; then
  dirs=("$ROOT"/*/)
  scope_label="all"
else
  [ "$SCOPE" = "." ] && SCOPE="$PWD"
  # 저장소 하위 디렉토리에서 연 세션도 포함하려면 루트 기준으로 찾아야 한다.
  SCOPE=$(git -C "$SCOPE" rev-parse --show-toplevel 2>/dev/null || printf '%s' "${SCOPE%/}")
  prefix=$(printf '%s' "$SCOPE" | sed 's/[/.]/-/g')
  dirs=("$ROOT/$prefix"*/)
  scope_label="$SCOPE"
fi

cutoff=$(( $(date +%s) - DAYS * 86400 ))
index=$(mktemp)
trap 'rm -f "$index"' EXIT

# 1단계: 기간에 드는 세션을 마지막 메시지 시각과 함께 모은다.
# mtime은 실제 마지막 메시지보다 늦을 수는 있어도 이를 수는 없으므로,
# mtime으로 넉넉히 거른 뒤 실제 timestamp로 다시 판정한다.
for dir in "${dirs[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do
    [ -s "$f" ] || continue
    last=$(jq -r 'select(.timestamp) | .timestamp' "$f" 2>/dev/null | tail -1) || continue
    [ -n "$last" ] || continue
    epoch=$(to_epoch "${last:0:19}") || continue
    [ -n "$epoch" ] || continue
    [ "$epoch" -ge "$cutoff" ] || continue
    printf '%s\t%s\n' "$epoch" "$f" >> "$index"
  done < <(find "$dir" -maxdepth 1 -name '*.jsonl' -mtime -"$((DAYS + 1))" 2>/dev/null)
done

# 2단계: 오래된 것부터 출력한다. 무엇이 반복인지 보려면 시간 순서가 필요하다.
found=0
while IFS=$'\t' read -r epoch f; do
  utterances=$(jq -s -r '
    def utext:
      (.message.content
       | if type == "string" then .
         else (map(select(.type == "text").text) | join(" ")) end);
    def asum:
      if . == null then "-"
      else ((.message.content // [])
            | map(if .type == "tool_use" then .name
                  elif .type == "text" then (.text | gsub("\\s+"; " ") | .[0:80])
                  else empty end)
            | join(", ") | .[0:120])
      end;
    reduce .[] as $r ({prev: null, out: []};
      if $r.type == "assistant" and $r.isSidechain != true then .prev = $r
      elif ($r.type == "user" and $r.isSidechain != true and $r.isMeta != true
            and ($r.toolUseResult | not))
        then .out += [{u: $r, a: .prev}]
      else . end)
    | .out[]
    | (.u | utext) as $raw
    | select($raw | type == "string")
    | ($raw | gsub("\\s+"; " ")) as $t
    | select($t | test("^<(command-name|command-message|local-command|bash-input|task-notification|system-reminder|hook|ide)") | not)
    | select($t | length > 4)
    | "    ↳ 직전: " + (.a | asum) + "\n> [" + (.u.uuid[0:8]) + "] " + ($t[0:400])
  ' "$f" 2>/dev/null) || continue

  # 발화가 없는 세션은 회고할 것이 없다.
  [ -n "$utterances" ] || continue

  # 깨진 라인이 섞인 기록이 있어도 세션 하나 때문에 전체가 멈추면 안 된다.
  title=$(jq -r 'select(.type == "ai-title") | .aiTitle' "$f" 2>/dev/null | head -1) || true
  cwd=$(jq -r 'select(.cwd) | .cwd' "$f" 2>/dev/null | head -1) || true

  printf '=== [%s] %s\n' "$(fmt_time "$epoch")" "${title:-제목없음}"
  printf -- '--- 프로젝트: %s\n' "${cwd:-알수없음}"
  printf -- '--- 기록: %s\n' "$f"
  printf '%s\n\n' "$utterances"
  found=$((found + 1))
done < <(sort -n "$index")

if [ "$found" -eq 0 ]; then
  echo "최근 ${DAYS}일 내 세션 기록이 없다 (범위: ${scope_label})" >&2
  exit 2
fi

echo "총 ${found}개 세션 (범위: ${scope_label}, 오래된 순)" >&2
