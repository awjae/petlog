# Decision: Server State — Apollo Client v4 채택 (TanStack Query 대체)

## Status

결정됨 (2026-06-25)
`007-frontend-state-management.md`의 Server State 결정을 대체한다.

---

## Context

Petlog 백엔드는 GraphQL Code-first 전용이다.

```
모든 도메인 데이터 → GraphQL (/api/graphql)
인증만 REST        → /api/auth/*
```

초기 설계(`007`)에서 Server State를 TanStack Query로 관리하기로 했으나,
프론트엔드 구현 진입 시점에 재검토했다.

---

## Problem

TanStack Query는 GraphQL을 위해 만들어진 라이브러리가 아니다.

GraphQL과 함께 쓰려면 직접 transport를 연결해야 한다.

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

### 5. Mutation 후 캐시 업데이트 패턴

```typescript
// Apollo — refetchQueries 또는 cache.modify
const [createHealthRecord] = useMutation(CREATE_HEALTH_RECORD, {
  refetchQueries: [{ query: PET_DETAIL_QUERY, variables: { id: petId } }],
});

// 또는 optimisticResponse로 즉시 반영
const [createHealthRecord] = useMutation(CREATE_HEALTH_RECORD, {
  optimisticResponse: { createHealthRecord: { id: 'temp', ...input } },
  update(cache, { data }) {
    cache.modify({ id: `Pet:${petId}`, fields: { healthRecords: ... } });
  },
});
```

TanStack Query의 `invalidateQueries`도 같은 결과를 낼 수 있다.
Apollo의 우위는 `optimisticResponse`(낙관적 UI)와 `cache.modify`(리패치 없이 캐시 직접 수정)다.
모바일 UX에서 즉각적인 피드백이 필요한 화면(체중 기록, 메모 작성)에서 차이가 난다.

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
제거: @tanstack/react-query, axios
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
