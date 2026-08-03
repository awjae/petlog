---
description: 현재 변경사항을 커밋하고 PR로 올린다
---

$ARGUMENTS
(비우면 현재 브랜치의 커밋되지 않은 변경 + 미푸시 커밋 전체를 대상으로 한다)

현재 작업을 커밋 → 푸시 → PR 생성까지 진행한다.

---

## 1. 상태 파악 (먼저 확인하고 시작한다)

```bash
git status --short
git log --oneline origin/main..HEAD
git fetch origin main --quiet && git log --oneline main..origin/main
```

확인할 것:

- **현재 브랜치가 main인가?** → main에 직접 커밋하지 않는다. 새 브랜치를 판다.
- **이미 이 브랜치로 열린 PR이 있는가?** (`gh pr list --head <branch>`)
  → 있으면 새 PR을 만들지 않고 기존 PR에 커밋을 추가한다.
- **브랜치의 기존 커밋이 이미 main에 머지됐는가?**
  → squash merge되면 로컬 브랜치에 커밋이 남아있어도 이미 반영된 상태다.
  main과 origin/main 로그를 비교해 확인한다.

## 2. PR 범위 판단

이번 변경이 **현재 브랜치의 기존 커밋과 같은 주제인가?**

- 같은 주제 → 현재 브랜치에 커밋
- 다른 주제 → `git checkout -b <새브랜치> origin/main`으로 분리한다.
  커밋되지 않은 변경은 브랜치 전환 시 따라오므로 stash 없이 그대로 진행할 수 있다.
  단, 새 base와 파일이 충돌하지 않는지 먼저 확인한다.

애매하면 **묻는다.** 성격이 다른 변경이 한 PR에 섞이면 리뷰 단위가 무너진다.

## 3. 커밋 전 검증

변경 범위에 해당하는 것만 돌린다. 실패하면 PR을 올리지 않고 먼저 고친다.

```bash
# backend
cd backend && npx jest && npx tsc --noEmit -p tsconfig.json

# frontend
cd frontend && npm run lint && npx tsc --noEmit
```

테스트를 추가했다면 **그 테스트가 실제로 회귀를 잡는지** 확인한다.
수정한 코드를 잠깐 되돌렸을 때 새 테스트만 실패해야 한다.
통과만 확인한 테스트는 검증된 테스트가 아니다.

## 4. 커밋

- 관련 없는 파일을 함께 스테이징하지 않는다 (`git add <파일>`, `git add -A` 금지)
- 메시지는 **한글**, 형식은 `type: 요약`
  (`fix:` / `feat:` / `perf:` / `refactor:` / `chore:` / `docs:` / `test:`)
- 본문에는 **무엇을 바꿨는지가 아니라 왜 바꿨는지**를 쓴다.
  무엇을 바꿨는지는 diff가 이미 말해준다.
- Sentry 이슈에서 출발한 수정이면 본문에 `Fixes <ISSUE-SHORT-ID>`를 넣는다 (머지 시 자동 close)
- 마지막 줄:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

lint-staged가 커밋 훅에서 eslint/prettier를 돌린다. 훅이 파일을 고치면 그대로 커밋된다.

## 5. PR 생성

```bash
git push -u origin <branch>
gh pr create --base main --title "<제목>" --body "$(cat <<'EOF'
...
EOF
)"
```

### PR 본문 구성

Petlog는 포트폴리오이기도 하다. PR은 **"어떤 문제를 어떻게 판단해서 풀었는가"** 를 보여주는 기록이다.
변경 파일 나열은 diff가 이미 보여주므로 쓰지 않는다.

- **배경** — 무엇이 문제였나. 어떻게 발견했나 (Sentry 이슈, 사용자 제보, 리뷰 등 출처를 남긴다)
- **원인** — 근본 원인. 남의 코드가 원인이면 **해당 파일:라인이나 코드 인용**으로 근거를 댄다.
  "그럴 것이다"가 아니라 확인한 사실만 쓴다.
- **영향 범위** — 이 버그를 실제로 밟는 시나리오. 계기가 된 사례 하나만 쓰지 말고
  같은 경로를 타는 케이스를 모두 적는다. 표가 잘 맞는다.
- **변경** — 왜 이 방법인가. 고려했지만 택하지 않은 대안이 있으면 이유와 함께.
- **검증** — 돌린 것과 그 결과. 회귀 검출력을 확인했으면 그것도 쓴다.
- **후속 논의** — 발견했지만 이 PR 범위 밖인 것. 범위를 넘기지 않고 기록만 남긴다.

없는 섹션은 억지로 채우지 않는다. 사소한 수정이면 배경 + 변경만으로 충분하다.

마지막 줄:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 6. 보고

PR URL을 알려준다. 검증에서 실패했거나 건너뛴 게 있으면 **반드시 함께 말한다.**
일부만 하고 완료라고 하지 않는다.

---

## 하지 않는 것

- main에 직접 커밋 / 푸시
- 요청 없는 `--force` 푸시
- 요청 없는 머지 (PR 생성까지가 이 커맨드의 범위다)
- 이번 변경과 무관한 파일을 끼워 커밋
- 검증 실패를 덮고 PR 생성
