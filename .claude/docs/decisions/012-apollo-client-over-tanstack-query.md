# Decision: Server State — Apollo Client v4 채택 (TanStack Query 대체)

## Status

결정됨 (2026-06-25)
`007-frontend-state-management.md`의 Server State 결정을 대체한다.

갱신 이력:
- 2026-07-27 — Reason의 "Mutation 이후 캐시 갱신" 항목에 운영 기준(refetchQueries 기본, 낙관적 업데이트 적용 조건)을 실제 코드 기준으로 반영
- 2026-07-27 — Context/Problem이 겪은 문제처럼 읽히던 서술을 사전 검토였다는 사실로 정정

---

## Context

Petlog 백엔드는 GraphQL Code-first 전용이다.

```
모든 도메인 데이터 → GraphQL (/api/graphql)
인증만 REST        → /api/auth/*
```

초기 설계(`007`)에서 Server State를 TanStack Query로 관리하기로 했으나,
프론트엔드 구현에 착수하기 전에 재검토했다.

**시점을 분명히 해 둔다.** TanStack Query는 실제로 사용된 적이 없다.
`package.json`에 이틀간(2026-06-23 `2f83455` → 06-25 `ba684df`) 의존성으로만 선언돼
있었고, 그동안 `frontend/src`에는 파일이 3개(`layout.tsx`, `page.tsx`,
`lib/apiClient.ts`)뿐이었다. 이 문서는 마이그레이션 회고가 아니라 **착수 전 라이브러리
선택 검토**다.

---

## Problem

TanStack Query는 GraphQL을 위해 만들어진 라이브러리가 아니다.

GraphQL과 함께 쓰려면 직접 transport를 연결해야 한다.

아래 코드는 실제로 작성한 것이 아니라, 검토 과정에서 "이 조합으로 가면 무엇을 직접
만들어야 하는가"를 그려 본 것이다.

```typescript
// gqlRequest wrapper를 직접 만들어야 함
async function gqlRequest<T>(query: string, variables?: unknown): Promise<T> {
  const { data } = await apiClient.post('/graphql', { query, variables });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

// 쿼리 문자열과 반환 타입 사이에 타입 연결 없음
const { data } = useQuery({
  queryKey: ['pets'],
  queryFn: () => gqlRequest<{ pets: Pet[] }>('query { pets { id name } }'),
});
```

이 구조의 문제:

1. **wrapper 유지 비용**: 인증 에러, 네트워크 에러, GraphQL errors 배열 파싱을 직접 처리해야 한다
2. **타입 체인 단절**: 쿼리 문자열과 반환 타입이 수동으로 맞춰야 하며, 스키마 변경 시 컴파일 오류가 나지 않는다
3. **GraphQL과 맞지 않는 추상화**: `queryKey` / `queryFn` 패턴은 REST 중심 설계다. GraphQL의 Operation 개념이 없다

---

## Decision

**Server State 관리: Apollo Client v4**

TanStack Query와 axios를 제거하고 Apollo Client로 교체한다.

```
Apollo Client
├── GraphQL 요청 (useQuery / useMutation)
├── 정규화 캐시 (InMemoryCache)
└── Link 체인 (errorLink → httpLink)

Zustand
└── UI 전역 상태 (인증 여부, 사용자 정보 등)
```

---

## Reason

### 1. GraphQL Operation이 직접 훅에 연결된다

Apollo에서 쿼리는 wrapper 없이 `useQuery`에 바로 전달된다.

```typescript
// Apollo — 쿼리 문서가 훅과 직접 연결
const PETS_QUERY = gql`
  query GetPets {
    pets { id name species }
  }
`;
const { data, loading, error } = useQuery(PETS_QUERY);

// TanStack Query — wrapper를 거쳐야 함
const { data, isLoading, error } = useQuery({
  queryKey: ['pets'],
  queryFn: () => gqlRequest('query GetPets { pets { id name species } }'),
});
```

`queryKey`는 GraphQL에서 의미 없는 개념이다. Apollo는 Operation 이름을 식별자로 사용한다.

### 2. TypedDocumentNode — 스키마에서 컴포넌트까지 타입이 연결된다

graphql-codegen과 조합하면 쿼리 결과 타입이 스키마에서 자동 생성된다.

```typescript
// codegen이 생성한 타입 — 스키마 변경 시 자동 반영
const { data } = useQuery(PETS_QUERY);
//    data.pets[0].name → string  (스키마 String! 기반 추론)
//    data.pets[0].foo  → 컴파일 오류 (스키마에 없는 필드)
```

TanStack Query에서 같은 타입 안전성을 얻으려면 `gqlRequest<ReturnType>`을 수동으로 맞춰야 하며, 스키마 변경이 타입 오류로 드러나지 않는다.

### 3. 에러 처리가 Link 체인으로 분리된다

GraphQL 에러는 HTTP 200으로 오면서 `errors` 배열에 담긴다.
TanStack Query는 이 구조를 모르기 때문에 직접 파싱해야 한다.

```typescript
// TanStack Query — 직접 처리
queryFn: async () => {
  const res = await fetch('/api/graphql', { body: JSON.stringify({ query }) });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message); // 직접 처리
  return json.data;
},

// Apollo — errorLink가 앱 전체에서 일괄 처리
const errorLink = new ErrorLink(({ error, forward, operation }) => {
  if (CombinedGraphQLErrors.is(error)) { /* 401 처리, 로깅 등 */ }
});
```

인증 만료(401), 권한 없음, 서버 오류를 한 곳에서 처리할 수 있다.

### 4. 캐시 구조의 근본적 차이

TanStack Query는 **키 기반 캐시**다. 쿼리 결과를 통째로 저장하며, 같은 엔티티가 여러 쿼리에 **복사본**으로 존재한다.

```
TanStack Query 캐시:
  ['pets']       → [{ id:'abc', name:'초코', weight:5.2 }, ...]  ← 복사본 A
  ['pet', 'abc'] → { id:'abc', name:'초코', weight:5.2 }         ← 복사본 B
```

Apollo는 **엔티티 기반 캐시(정규화)**다. `__typename + id` 기준으로 엔티티를 하나만 저장하고, 쿼리들이 레퍼런스로 참조한다.

```
Apollo InMemoryCache:
  ROOT_QUERY.pets      → [ref: Pet:abc, ...]
  ROOT_QUERY.pet(abc)  → ref: Pet:abc

  Pet:abc → { id:'abc', name:'초코', weight:5.2 }  ← 단 하나
```

체중 업데이트 뮤테이션 이후 차이:

```
TanStack Query:
  복사본 B만 업데이트됨 → 복사본 A는 여전히 5.2
  → invalidateQueries(['pets']) 를 개발자가 직접 호출해야 동기화
  → 빠뜨리면 목록과 상세 화면의 데이터가 달라짐

Apollo:
  Pet:abc 하나만 업데이트 → 이를 참조하는 모든 쿼리 자동 갱신
  → 개발자가 할 일 없음
```

Petlog는 Pet 한 마리가 목록, 상세, 타임라인, 리포트에 동시에 노출된다.
TanStack Query에서는 관련 queryKey를 빠짐없이 무효화해야 하며, 누락 시 화면 간 불일치가 발생한다.

### 5. Mutation 이후 캐시 갱신 — 무엇을 쓰고 무엇을 쓰지 않는가

Apollo는 뮤테이션 이후 갱신 수단을 세 가지 제공한다.

| 수단 | 동작 | TanStack Query 대응 |
|------|------|-------------------|
| `refetchQueries` | 서버에서 다시 가져온다 | `invalidateQueries` |
| `cache.modify` | 요청 없이 캐시를 직접 고친다 | 없음 |
| `optimisticResponse` | 응답 도착 전에 예상 결과를 화면에 반영한다 | 없음 |

뒤 두 개가 Apollo 고유의 수단이다.

**단, 이 항목은 Apollo 채택의 근거로는 약하다.** 채택 당시에는 "체중 기록·메모 작성 같은
화면에서 낙관적 UI가 이긴다"고 봤지만, 실제로는 기록 계열 전체를 `refetchQueries`로
운영하기로 결정했다(아래). Apollo를 고른 실질적 이유는 앞의 네 항목 — 특히
"캐시 구조의 근본적 차이"(정규화 캐시) — 이고, 이 항목은 아니다.

#### 적용 기준 (2026-07-27)

기본은 `refetchQueries`이고, 낙관적 수단은 **클라이언트가 결과를 100% 아는 경우에만** 쓴다.

| 대상 | 방식 | 값의 성격 |
|------|------|----------|
| 알림 토글 (`useNotificationPreference`) | `optimisticResponse` | boolean 3개 |
| 프로필 이름 (`useUpdateProfile`) | `cache.modify` — `me` 필드 | 문자열 하나 |
| 건강 기록 / 의료 이벤트 / 투약 등 | `refetchQueries` | 서버 파생 값 포함 |

기록 저장을 낙관적으로 처리하지 않는 이유는 **서버가 파생시키는 값**을 클라이언트가
예측해야 하기 때문이다.

- `Pet.todayRecordCount`, `Pet.totalHealthRecordCount`
- `Pet.recentWeight` — 직전 값 대비 증감 포함 (정렬·이력이 얽혀 어긋나기 쉽다)
- `Pet.recentHealthRecords(limit)`
- `CalendarEvent` — 건강 기록·백신·투약·예약·진료 5개 테이블을 날짜 범위로 병합한 결과

얻는 것은 수백 ms의 체감 단축이고, 잃는 것은 "화면 숫자와 서버 숫자가 다르다"는 종류의
버그다. 건강 기록 서비스에서 후자가 더 비싸다.

#### refetchQueries의 실제 비용

`refetchQueries`에 쿼리 **이름 문자열**을 넘기면 그 이름을 가진 *현재 마운트된* 쿼리만
재조회한다(`QueryManager.getObservableQueries()`가 살아 있는 ObservableQuery만 순회한다).
`useCreateHealthRecord`가 이름 3개를 적은 것은 "3번 재조회"가 아니라 "이 중 화면에 떠 있는
것만 갱신하라"는 선언이며, 실제 요청은 화면당 1건이다. `awaitRefetchQueries`도 켜지 않아
사용자가 재조회 완료를 기다리지 않는다.

전제: **목록 조회 훅은 `fetchPolicy: 'cache-and-network'`를 명시한다.** 마운트되지 않아
재조회를 건너뛴 화면의 정합성은 "이동 시점의 재조회"가 보장하는데, `cache-first`(Apollo
기본값)로 두면 이 보장이 깨진다. 정규화 캐시에 `HealthRecord` 객체는 들어와 있어도
`healthRecords(petId)` 루트 필드의 배열에는 새 항목이 추가되지 않기 때문이다.

#### 재검토 조건

다음 중 하나가 관측되면 낙관적 업데이트를 다시 검토한다.

1. 저장 후 목록 갱신까지의 체감 지연이 실제로 보고될 때
2. 뮤테이션 응답이 파생 값을 함께 반환하도록 스키마가 바뀔 때 — `createHealthRecord`가
   갱신된 `Pet`을 반환하면 정규화 캐시가 `Pet:<id>`를 자동 갱신하므로 `update` 콜백조차
   필요 없다. 이쪽이 낙관적 업데이트보다 먼저 검토할 가치가 있다

---

## Why Not TanStack Query

| 항목 | TanStack Query | Apollo Client v4 |
|------|---------------|-----------------|
| 설계 목적 | REST + GraphQL 범용 | GraphQL 전용 |
| GraphQL transport | 직접 구현 필요 | HttpLink 기본 제공 |
| TypedDocumentNode | 수동 타입 매핑 | codegen 연동으로 자동 |
| 에러 처리 | queryFn마다 직접 처리 | errorLink에서 일괄 처리 |
| 정규화 캐시 | 기본 없음 (invalidateQueries) | InMemoryCache 기본 제공 |
| optimisticResponse | 수동 구현 | useMutation 옵션으로 지원 |
| 훅 추상화 | queryKey/queryFn (REST 패턴) | useQuery/useMutation (GraphQL 패턴) |

TanStack Query가 틀린 선택이 아니다.
GraphQL + REST 혼용이거나 GraphQL 기능을 얕게 쓰는 프로젝트에 적합하다.
Petlog는 GraphQL 전용이고 도메인 관계가 복잡하므로 Apollo가 더 적합하다.

---

## Trade-off

### 수용한 비용

- **번들 크기**: Apollo Client v4 (~47KB gzip)가 TanStack Query (~13KB)보다 크다
- **InMemoryCache 설정 복잡도**: `typePolicies`, `keyFields`, `merge` 함수 이해 필요. 도메인이 복잡해질수록 캐시 정책도 복잡해진다
- **Next.js 16 App Router 완전 지원 미흡**: `@apollo/experimental-nextjs-app-support`가 아직 Next.js 15까지만 지원한다. 현재는 클라이언트 사이드 ApolloProvider로 동작한다. httpOnly 쿠키 인증 구조상 RSC에서 인증된 GraphQL 요청이 불가능하므로 실질적 영향은 없다

### 수용 이유

번들 크기 증가는 정규화 캐시, optimisticResponse, errorLink로 얻는 개발 생산성과 UX 품질로 상쇄된다.
캐시 설정 복잡도는 도메인이 단순한 초기에는 낮고, 복잡해질수록 TanStack Query의 수동 invalidation 비용도 함께 높아진다.

---

## 적용 내용

```
제거: @tanstack/react-query  (사용처 없던 의존성 선언)
      axios + src/lib/apiClient.ts  (57줄, import한 곳 없음)
추가: @apollo/client@4, graphql

src/lib/apollo/
├── client.ts          # makeClient() 팩토리 — httpLink를 내부에서 생성
└── links/
    └── errorLink.ts   # CombinedGraphQLErrors 기반 401 감지 → refresh → 큐 재시도

src/lib/auth/
└── authFetch.ts       # REST auth 전용 fetch 래퍼

src/providers/
└── ApolloProvider.tsx # 'use client' — useState로 client 인스턴스 고정
```
