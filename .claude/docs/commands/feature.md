# Feature 명령어 가이드

## 목적

새로운 기능을 Petlog에 추가할 때 따라야 할 순서와 체크리스트를 제공한다.

---

## 1. 기능 추가 전 확인

새로운 기능 요청을 받으면 먼저 다음을 확인한다.

### 도메인 질문

- 이 기능은 어느 도메인에 속하는가?
- 기존 도메인으로 처리 가능한가? 새로운 도메인이 필요한가?
- 데이터 모델에 어떤 영향을 미치는가?

### 제품 질문

- 어떤 사용자 문제를 해결하는가?
- MVP 범위 안에 있는가?
- Non-Goal로 정의된 기능은 아닌가?

---

## 2. 기능 추가 순서

### Step 1: 도메인 모델 확인

`docs/domain-model.md`를 참고하여 기능이 속할 도메인을 확인한다.

필요 시 새로운 도메인 엔티티를 설계한다.

### Step 2: Database Schema 설계

`docs/database.md`를 참고하여 테이블 변경 또는 추가 여부를 결정한다.

Migration 파일을 먼저 작성한다.

### Step 3: Backend API 설계

`docs/api.md`를 참고하여 엔드포인트를 설계한다.

순서:

1. DTO 정의
2. Controller 작성
3. Service 작성
4. Repository 작성

### Step 4: Frontend 구현

Feature Based Architecture를 따른다.

구조:

```
features/{domain}/
  api/
  components/
  hooks/
  types/
```

### Step 5: 연결 및 검증

- API 연동 확인
- Loading / Error / Success / Empty 상태 처리 확인
- 모바일 레이아웃 확인

---

## 3. 코드 작성 규칙

`docs/development-rules.md`의 규칙을 따른다.

핵심:

- Controller는 얇게 유지
- 비즈니스 로직은 Service에만
- Component에서 직접 API 호출 금지
- TypeScript `any` 사용 금지

---

## 4. 완료 체크리스트

- 도메인 모델과 일치하는가?
- Database Migration이 있는가?
- API Request / Response 타입이 정의되어 있는가?
- Error Case가 처리되어 있는가?
- Loading / Empty / Error 상태가 있는가?
- 모바일 레이아웃이 동작하는가?
- `any` 타입이 없는가?
