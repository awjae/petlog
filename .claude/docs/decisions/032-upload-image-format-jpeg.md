# Decision: 클라이언트 이미지 압축 출력은 jpeg 단일 포맷으로 고정한다

## Status

결정됨 (2026-07-28).

관련: `frontend/src/features/pet/utils/compressImage.ts`,
`frontend/src/features/pet/types/upload.ts`

---

## Context

반려동물 사진을 업로드 전에 브라우저에서 줄이는 기능(`compressImage`)을 도입하면서
출력 포맷을 webp로 골랐다. 같은 화질에서 가장 작기 때문이었고, Chromium에서 3000x2000
사진이 89% 줄어드는 것을 확인하고 머지했다.

**그런데 Safari에서 업로드가 동작하지 않았다.**

---

## 확인한 사실

### Safari는 canvas로 webp를 만들지 못한다

Safari 26.5(Apple 배포판, macOS)에서 직접 실행해 확인했다.

```
canvas.toBlob(cb, 'image/webp')  → image/png            ← 요청과 다른 타입
canvas.toDataURL('image/webp')   → data:image/png;...   ← 동일
canvas.toBlob(cb, 'image/jpeg')  → image/jpeg           ← 정상
<img src="data:image/webp,...">  → 정상 표시            ← 디코딩은 됨
```

**디코딩과 인코딩은 별개다.** Safari 14부터 webp "표시"는 되므로 "Safari도 webp를
지원한다"는 자료만 보고 인코딩까지 된다고 착각하기 쉽다.

더 나쁜 건 실패 방식이다. 만들지 못하는 타입을 요청받으면 예외를 던지지 않고 **조용히
png를 돌려준다.** 그래서 단일 포맷만 시도하면 실패했다는 사실 자체를 알 수 없다.

### 그 결과 Safari에서는 압축이 한 번도 동작하지 않았다

`compressImage`에는 `blob.type !== OUTPUT_TYPE`이면 원본을 반환하는 가드가 있었다.
사진에서 png는 원본보다 커지기 쉬우므로 이 가드 자체는 옳다. 하지만 Safari에서는 이
가드에 **항상** 걸려 원본이 그대로 나갔고, 5MB를 넘는 아이폰 사진은
`pet.upload.ts`의 크기 검사에서 "사진 용량이 너무 커요"로 거부됐다. Chrome에서는 300KB로
줄어 통과하는 바로 그 사진이다.

반려동물 등록은 첫 사용자가 반드시 통과해야 하는 관문이라 실패 비용이 가장 큰 지점이다.

### webp의 실익은 생각보다 작다

처음 측정한 "webp가 2.6배 작다"는 수치는 랜덤 사각형 3000개를 그린 합성 이미지 기준으로,
jpeg에 불리한 최악의 케이스였다. **실제 사진**(3000x1687, 1215KB)으로 다시 측정했다.

| 인코딩 | 크기 | webp 대비 |
| --- | --- | --- |
| webp q0.85 | 85KB | 1.00 |
| jpeg q0.85 | 101KB | 1.19 |
| jpeg q0.80 | 85KB | 1.00 |

차이는 **16KB**다. 96px로 표시되는 아바타에서 사용자가 체감할 수 없다.

### 저장 포맷은 사용자에게 전달되지 않는다

반려동물 사진은 전부 `next/image`로 렌더링한다(`PetProfileSummary`, `PetSelector`,
`PetSummaryCard`). Next.js Image Optimization이 Accept 헤더에 맞춰 **서빙 시점에**
webp/avif로 다시 인코딩하므로, jpeg로 저장해도 Chrome 사용자는 webp를 내려받는다.
업로드 때 webp를 만들어도 그 이득이 전달 단계까지 살아남지 않는다.

---

## Decision

**`compressImage`의 출력은 브라우저와 무관하게 항상 `image/jpeg`로 고정한다.**

`OUTPUT_TYPE = 'image/jpeg'`, 품질 0.85, 긴 변 1024px.

### webp 폴백(webp 시도 → 실패 시 jpeg)을 택하지 않은 이유

폴백 방식도 Safari 버그는 고친다. 그런데도 단일 포맷을 고른 이유는 **브라우저별 분기
자체가 이번 버그의 원인**이기 때문이다. 폴백을 두면 Chrome은 webp 경로, Safari는 jpeg
경로로 갈라지고, 검증은 대개 Chrome에서만 한다. 단일 포맷이면 모든 브라우저가 같은
코드를 타므로 Chrome에서 한 검증이 Safari 검증이 된다.

이 안전성을 16KB와 맞바꾼다.

### 서버 허용 목록은 그대로 둔다

`SERVER_ALLOWED_TYPES`(jpeg/png/webp/gif)는 축소하지 않는다. 이건 "우리가 만드는 포맷"이
아니라 "서버가 받는 포맷"이고, 사용자가 webp/png 파일을 직접 고르는 경로는 계속 열려
있어야 한다. GIF는 canvas로 다시 그리면 첫 프레임만 남으므로 압축 대상에서 제외한다.

### 부수 효과: 아이폰 HEIC 업로드가 Safari에서 통과한다

**Safari는 HEIC를 디코드할 수 있다**(Chromium은 못 한다 —
`InvalidStateError: The source image could not be decoded`). webp만 시도하던 때는
Safari가 HEIC를 열고도 인코딩에 실패해 원본 HEIC를 되돌려줬고, 서버가 HEIC를 거부해
"지원하지 않는 사진 형식이에요"가 떴다. jpeg로 내보내면서 이 경로가 살아났다.

이를 위해 "재인코딩 결과가 원본보다 크면 원본을 쓴다"는 규칙에 예외를 뒀다. **원본이
서버가 받지 않는 형식이면 커지더라도 변환 결과를 쓴다** — 원본을 돌려주면 크기와 무관하게
업로드가 막히기 때문이다. 이 판단에 압축기도 서버 허용 목록을 알아야 해서
`SERVER_ALLOWED_TYPES` / `SERVER_MAX_SIZE_BYTES`를 `features/pet/types/upload.ts`로
분리해 압축기와 업로더가 공유한다.

---

## 검증

수정된 `compressImage`를 번들해 두 엔진에서 실제로 실행했다.

| 입력 | Chromium | WebKit (Safari) |
| --- | --- | --- |
| 3000x2000 jpeg 1307KB | jpeg OK | jpeg OK |
| 400x400 png 25KB | 원본 유지 OK | 원본 유지 OK |
| 아이폰 HEIC | 거부(형식) — 디코드 불가 | jpeg 변환 OK |

Chromium에서 HEIC가 거부되는 건 엔진이 디코드하지 못해서이며, 이때 나가는 안내는
"지원하지 않는 사진 형식이에요. JPG나 PNG로 저장해서 올려주세요"로 사용자가 따라 할 수
있는 내용이다.

`createImageBitmap(file, { imageOrientation: 'from-image' })`은 Safari 26.5에서 정상
동작하므로 EXIF 회전 처리는 두 엔진 모두 문제없다.

---

## 재검토 조건

- **Safari가 canvas webp 인코딩을 지원할 때** — 그때도 자동으로 webp로 돌아가지 않는다.
  실익이 16KB인 이상, 포맷을 늘리는 것보다 단일 경로를 유지하는 편이 낫다. 전 브라우저가
  지원해서 **분기 없이** webp 하나로 갈 수 있게 됐을 때만 바꾼다.
- **`next/image`를 걷어낼 때** — CloudFront에서 원본을 직접 서빙하게 되면 저장 포맷이
  곧 전송 포맷이 된다. 그때는 서버 측 정규화(sharp 등)를 함께 검토한다.
- **아바타보다 큰 이미지를 다루게 될 때** — 기록 첨부 사진처럼 원본 해상도가 의미 있는
  용도가 생기면 1024px / q0.85 값부터 다시 정한다.
- **브라우저별 업로드 실패가 관측될 때** — 지금은 압축 실패가 조용히 원본 통과로 이어져
  사용자 신고 전에는 알 수 없다. 계측을 붙일지는 별도 판단한다.
