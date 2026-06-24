# Decision: Refresh Token 보안 — RTR + DB 저장

## Context

초기 구현에서 Refresh Token은 JWT로 발급하고 httpOnly 쿠키에 저장했다.

서버는 토큰을 별도로 저장하지 않았다. JWT 서명 검증만으로 유효성을 판단했다.

---

## Problem

DB에 저장하지 않으면 다음이 불가능하다:

1. **탈취된 토큰 무효화** — JWT 자체가 유효하면 서버에서 막을 방법이 없다
2. **전체 기기 로그아웃** — 어떤 토큰이 발급됐는지 서버가 모른다
3. **토큰 재사용 탐지** — 이미 사용된 토큰으로 재요청 시 탐지 불가

---

## Decision

Refresh Token을 DB에 저장하고, RTR(Refresh Token Rotation)을 적용한다.

### 저장 방식

```
refresh_tokens
  id
  user_id
  token_hash   — SHA-256 해시만 저장 (평문 저장 금지)
  expires_at   — 만료 시각
  revoked_at   — 폐기 시각 (NULL이면 유효)
  created_at
```

평문을 저장하지 않는 이유: DB가 유출되더라도 토큰을 바로 사용할 수 없게 한다.

### RTR 흐름

```
1. 로그인
   → Access Token(15m) + Refresh Token(30d) 발급
   → Refresh Token을 SHA-256 해시 후 DB 저장

2. 토큰 갱신 요청 (/auth/refresh)
   → Refresh Token 쿠키 수신
   → JWT 서명 검증 (Guard)
   → DB에서 tokenHash 조회: revokedAt IS NULL AND expiresAt > NOW()
   → 기존 토큰 revokedAt 업데이트 (폐기)
   → 새 Access + Refresh Token 발급
   → 새 Refresh Token DB 저장

3. 로그아웃
   → 쿠키의 Refresh Token을 hash
   → DB에서 revokedAt 업데이트 (폐기)
   → 쿠키 삭제

4. 탈취 탐지
   → 이미 revokedAt이 있는 토큰으로 재요청
   → 해당 userId의 모든 Refresh Token 전부 폐기
   → 403 응답 (강제 재로그인)
```

탈취 탐지 대응 근거: 정상적인 클라이언트는 갱신 후 구 토큰을 버린다. 폐기된 토큰이 재사용된다는 것은 구 토큰이 제3자에게 있다는 뜻이다. 전체 폐기로 피해를 최소화한다.

### 만료 토큰 정리

`expires_at < NOW()` 레코드는 로직적으로 불필요하지만 테이블에 계속 쌓인다.

향후 대응:

- 배치 정리 (주 1회 DELETE WHERE expires_at < NOW() - 7d)
- 또는 PostgreSQL 파티셔닝 (created_at 기준 월별)

MVP에서는 주기적인 배치 삭제로 충분하다.

---

## 구현

```typescript
// 발급 시
const tokens = this.authService.createTokens(user);
await this.authService.storeRefreshToken(user.id, tokens.refreshToken);

// 갱신 시 (RTR)
const tokens = await this.authService.rotateRefreshToken(
  userId, oldToken, user
);

// 로그아웃 시
await this.authService.revokeRefreshToken(userId, rawToken);

// 탈취 탐지 시 (rotateRefreshToken 내부)
await this.revokeAllRefreshTokens(userId);
throw new UnauthorizedException(...);
```

---

## Trade-off

### 추가되는 DB 조회

토큰 갱신마다 DB 조회가 1회 추가된다.

Access Token 만료(15분)마다 발생하는 작업이므로 부하가 크지 않다.

인덱스: `tokenHash` 단독 인덱스로 조회 속도를 확보한다.

### Stateless JWT vs Stateful RefreshToken

Access Token은 여전히 Stateless JWT다 (DB 조회 없음).

Refresh Token만 Stateful로 관리한다.

이 구조는 두 방식의 장점을 절충한다.

- 일반 API 요청: JWT 서명 검증만으로 처리 (빠름)
- 토큰 갱신: DB 확인으로 보안 보장 (느리지만 드문 작업)

---

## Status

구현 완료. 만료 토큰 정리 배치는 추후 구현.
