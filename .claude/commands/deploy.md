---
description: 백엔드/프론트엔드를 ECS에 배포한다
---

배포 대상: $ARGUMENTS
(backend / frontend / all 중 지정, 미지정 시 all)

배포는 되돌리기 어려운 외부 작업이다. **각 단계가 실패하면 거기서 멈추고 원인을 보고한다.**
실패한 단계를 건너뛰거나 다음 단계로 넘어가지 않는다.

---

## 1. Backend

```bash
cd /Users/jason/Documents/vscode/petlog/backend
npm version patch --no-git-tag-version
npm run deploy
npm run migrate:deploy:ecs
```

- `npm version patch`가 먼저인 이유: `deploy`의 첫 단계 `deploy:check-version`이
  package.json 버전과 같은 태그가 이미 ECR에 있으면 배포를 막는다
  (`infra/scripts/check-version-not-deployed.sh`). 이 저장소는 git tag를 쓰지 않으므로
  `--no-git-tag-version`으로 package.json만 올린다.
- `npm run deploy` = check-version → ecr-login → build → ecr-push → ecs-force-redeploy.
  중간 단계에서 죽으면 이미지가 ECR에 올라갔는지 로그로 확인하고 보고한다.
- **`npm run deploy`가 실패하면 마이그레이션을 실행하지 않는다.**
- 버전 bump는 워킹트리에 남는다. 커밋은 이 커맨드 범위가 아니다 (`/pr`에서 처리).

## 2. Frontend

backend 배포와 마이그레이션이 **모두 성공한 뒤에만** 진행한다.

```bash
cd /Users/jason/Documents/vscode/petlog/frontend
npm version patch --no-git-tag-version
npm run deploy
```

## 3. 배포 후 확인

`.claude/docs/operations/deployment.md`의 "배포 후" 체크리스트를 따른다
(ALB 타겟 그룹 healthy, ECS 태스크 RUNNING 유지, CloudWatch Logs 에러 없음).

---

## 실패하는 경우

- **check-version에서 중단** — 버전 bump가 안 된 상태다. patch 후 다시 실행한다.
- **dotenv/환경변수 에러** — backend는 `backend/.env`와 `infra/.env`,
  frontend는 `frontend/.env.deploy` + `.env.local`이 필요하다.
- **AWS 인증 만료** — `aws sts get-caller-identity`로 먼저 확인한다.

## 하지 않는 것

- 인프라 배포(`cdktf deploy`) — 스택 구조가 바뀌었을 때만 별도로, 수동 승인 후 실행한다.
- 실패를 덮고 다음 단계 진행
- 버전 bump / 배포 결과 커밋·푸시

## 보고

배포한 대상과 각각의 새 버전, 마이그레이션 실행 결과를 알려준다.
멈춘 단계가 있으면 어디서 왜 멈췄는지, ECR/ECS가 어떤 상태로 남았는지 함께 말한다.
