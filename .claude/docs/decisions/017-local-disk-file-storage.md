# Decision: 이미지 업로드 — 로컬 디스크 저장 + 교체 가능한 경계 설계

## Status

결정됨 (최초 로컬 디스크 결정). **Object Storage(S3) 전환 완료**(이슈 #2, 아래 "이후 변경사항" 참고),
**magic-bytes 검증 완료**(이슈 #1, 2026-07-16). 이 문서의 Context/Decision/Reason은 로컬 디스크만
쓰던 최초 결정 당시 기록이고, 그 이후 상태는 문서 하단 "이후 변경사항"을 최신 출처로 삼는다.

---

## Context

반려동물 프로필 이미지, `MedicalEvent`의 첨부파일(`attachment`) 등 이미지 업로드가 필요하다.

`008-graphql-prisma.md`에서 파일 업로드는 GraphQL이 아닌 REST(`POST /api/upload`)로 별도 운영하기로 이미 결정했다. 이번 결정은 그 REST 엔드포인트가 파일을 "어디에" 저장하는지에 대한 것이다.

---

## Problem

업로드된 이미지를 어디에 저장할 것인가?

가능한 방향:

1. S3/Cloudflare R2 등 Object Storage에 바로 연동
2. 로컬 디스크(`multer.diskStorage`)에 저장하고 정적 파일로 서빙

---

## Decision

`UploadController`는 `multer.diskStorage`로 `process.cwd()/uploads`에 파일을 저장하고, `/api/uploads/:filename`으로 정적 서빙한다. 파일명은 원본 파일명을 쓰지 않고 `randomUUID() + extname(원본)`으로 생성한다.

Object Storage 연동은 지금 하지 않고, 코드에 명시적 TODO로 남긴다.

---

## Reason

### MVP 개발 속도 우선

포트폴리오/MVP 단계에서는 클라우드 계정 설정, 버킷 정책, presigned URL 구현보다 핵심 사용자 흐름(기록 → 리포트) 완성이 우선이다 (`CLAUDE.md` Development Priority).

### 교체 지점을 한 곳으로 좁혀둠

`storage`(diskStorage 설정)만 `UploadController` 상단에 격리해뒀다. `uploadImage` 핸들러와 반환하는 `{ url }` 응답 형태, 프론트엔드 호출부는 저장소 구현과 무관하게 동작한다. Object Storage로 교체할 때 이 `storage` 객체만 S3/R2 클라이언트 기반 구현으로 바꾸면 되고, 나머지 코드(프론트 포함)는 변경이 필요 없도록 경계를 설계했다. 이는 AI Provider 추상화(`002`)와 동일한 "교체 가능한 구조" 원칙을 파일 저장소에도 적용한 것이다.

### 파일명 UUID화로 충돌/추측 방지

원본 파일명을 그대로 쓰면 동시 업로드 시 파일명 충돌이나, 예측 가능한 URL로 인한 임의 파일 접근 위험이 있다. `randomUUID()`로 이를 차단한다.

---

## Trade-off (최초 결정 당시 알려진 한계 — 둘 다 해결됨, 아래 참고)

### 서버 재시작 시 파일 유실 위험 → 해결됨 (이슈 #2)

로컬 디스크 저장은 배포 환경(컨테이너 재시작, 다중 인스턴스 스케일 아웃)에서 파일이 사라지거나 인스턴스 간 공유되지 않는다. **상용화 이전에 반드시 Object Storage로 전환해야 하는 항목**으로 코드에 `TODO(1)`로 표시했고, [awjae/petlog#2](https://github.com/awjae/petlog/issues/2)로 트래킹했다.

### MIME 타입 검증의 한계 → 해결됨 (이슈 #1)

~~현재 `fileFilter`는 클라이언트가 선언한 `file.mimetype`만 검사한다. 파일 확장자/Content-Type을 위조하면 우회 가능하다. 실제 파일 바이너리(magic bytes)를 검사하지 않으므로, 상용화 전 `file-type` 패키지 등으로 강화가 필요하다.~~ (`TODO(2)`, [awjae/petlog#1](https://github.com/awjae/petlog/issues/1))

---

## 이후 변경사항

### Object Storage(S3) 전환 완료 (이슈 #2, CLOSED)

`upload.module.ts`가 `AWS_S3_BUCKET_NAME` 환경변수 유무로 `LocalDiskStorageProvider` ↔
`S3StorageProvider`를 DI 팩토리에서 자동 선택하도록 바뀌었다. 배포 환경(AWS ECS)은 S3 +
CloudFront로 서빙하고, 로컬 개발은 그 값이 비어있을 때만 여전히 로컬 디스크를 쓴다(위에서
설명한 "교체 가능한 경계 설계" 원칙 그대로 — `uploadImage` 핸들러와 `{ url }` 응답 형태는
안 바뀌었다). `README.md`의 Infrastructure 섹션이 최신 배포 구조의 출처다.

### magic-bytes 검증 추가 (이슈 #1, CLOSED, 2026-07-16)

`fileFilter`가 클라이언트 선언 `file.mimetype`만 보던 걸, `file-type` 패키지로 업로드된
버퍼의 실제 매직바이트를 검사하도록 `upload.controller.ts`를 바꿨다. 감지된 타입이 허용
목록(jpeg/png/webp/gif) 밖이면 거부한다.

이와 함께 **파일명 생성 방식도 바뀌었다** — 위 Decision 절의 `randomUUID() + extname(원본)`은
더 이상 정확하지 않다. 클라이언트가 보낸 원본 파일명의 확장자를 신뢰하지 않고,
`randomUUID() + '.' + (file-type이 감지한 실제 확장자)`로 저장 키를 만든다. S3에 저장할
때의 `ContentType`도 클라이언트 선언값이 아니라 감지된 실제 mime 타입을 쓴다.

기존 `fileFilter`(mimetype 체크)는 버퍼가 채워지기 전 단계라 값싼 사전 필터로만 남기고,
실제 보안 경계는 핸들러의 매직바이트 검사로 옮겼다. 자세한 배경은 이슈 #1 코멘트와
`upload.controller.spec.ts` 참고.

---

## 관련 이슈

- [#1 이미지 업로드 파일 타입 검증을 magic-bytes 기반으로 강화](https://github.com/awjae/petlog/issues/1) — CLOSED
- [#2 이미지 업로드를 Object Storage(S3/R2)로 전환](https://github.com/awjae/petlog/issues/2) — CLOSED
