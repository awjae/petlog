-- Petlog 사용 지표 — 리텐션·활성화를 앱 DB에서 직접 읽는다. 읽기 전용(SELECT만).
--
-- 클라이언트 계측 도구를 붙이기 전에 이 파일을 먼저 돌린다. 여기 있는 질문
-- (가입 후 계속 기록하는가 / 무엇을 기록하는가)은 전부 이미 쌓인 데이터로 답이 나오고,
-- 새 의존성도 개인정보 동의 갱신도 필요 없다. 계측 도구는 이걸로 답이 안 나오는
-- 화면 내부 이탈(어느 버튼에서 멈췄는가)을 볼 때 붙인다.
--
-- 실행:
--   터미널 A:  bash infra/scripts/db-tunnel.sh
--   터미널 B:  bash infra/scripts/db-credentials.sh app   # 비밀번호가 클립보드에 복사된다
--              psql "postgresql://petlog_app@localhost:15432/petlog" -f backend/scripts/usage-metrics.sql
--
-- 시각 기준:
--   컬럼은 TIMESTAMP(3) WITHOUT TIME ZONE에 UTC로 저장된다(Prisma 관례). 날짜로 자를 때는
--   반드시 KST로 옮긴다 — UTC로 그냥 자르면 한국 시간 오전 9시 이전 기록이 전부 전날로 밀린다.
--   집계 기준은 recorded_at이 아니라 created_at이다. recorded_at은 과거 날짜로 소급 입력이
--   가능해서 "언제 앱을 열었는가"를 나타내지 못한다.

\set QUIET on
\timing off

-- 내 테스트 계정을 빼려면 이 목록에 이메일을 추가한다 (기본값은 아무것도 제외하지 않음).
--   예: \set excluded_emails '''me@example.com'', ''test@example.com'''
\set excluded_emails ''''''

\set QUIET off

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TEMP VIEW kst_users AS
SELECT
  u.id,
  u.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul' AS signed_up_at,
  u.deletion_requested_at IS NOT NULL AS withdrawn
FROM users u
WHERE u.anonymized_at IS NULL
  AND u.email NOT IN (:excluded_emails);

CREATE TEMP VIEW kst_records AS
SELECT
  p.user_id,
  h.type,
  h.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul' AS logged_at
FROM health_records h
JOIN pets p ON p.id = h.pet_id
WHERE h.deleted_at IS NULL;

CREATE TEMP VIEW per_user AS
SELECT
  u.id,
  u.signed_up_at,
  u.withdrawn,
  (SELECT count(*) FROM pets p WHERE p.user_id = u.id AND p.deleted_at IS NULL) AS pets,
  count(r.*)                                AS records,
  count(DISTINCT r.logged_at::date)         AS active_days,
  max(r.logged_at)::date                    AS last_logged_on,
  -- 가입일부터 마지막 기록일까지 며칠을 버텼는가. 리텐션의 핵심 한 줄.
  max(r.logged_at)::date - u.signed_up_at::date AS lifespan_days
FROM kst_users u
LEFT JOIN kst_records r ON r.user_id = u.id
GROUP BY u.id, u.signed_up_at, u.withdrawn;

-- ── 1. 활성화 퍼널 ───────────────────────────────────────────────────────────
-- 가입한 사람이 어디서 멈추는가. 단계 간 낙폭이 가장 큰 곳이 다음에 고칠 화면이다.

\echo '=== 1. 활성화 퍼널 ==='
SELECT
  count(*)                                        AS "가입",
  count(*) FILTER (WHERE pets > 0)                AS "반려동물 등록",
  count(*) FILTER (WHERE records > 0)             AS "첫 기록",
  count(*) FILTER (WHERE active_days >= 3)        AS "3일 이상 기록",
  count(*) FILTER (WHERE lifespan_days >= 7)      AS "가입 7일 후에도 기록",
  count(*) FILTER (WHERE lifespan_days >= 30)     AS "가입 30일 후에도 기록",
  count(*) FILTER (WHERE withdrawn)               AS "탈퇴 요청"
FROM per_user;

-- ── 2. 가입 주차별 리텐션 코호트 ─────────────────────────────────────────────
-- "수기 기록 앱은 2주 만에 끊긴다"는 가설을 여기서 확인한다.
-- W0가 100%가 아니면 온보딩이 깨진 것이고, W2에서 0으로 떨어지면 가설이 맞는 것이다.

\echo ''
\echo '=== 2. 가입 주차별 기록 리텐션 (명) ==='
WITH activity AS (
  SELECT
    u.id AS user_id,
    date_trunc('week', u.signed_up_at)::date AS cohort_week,
    floor(extract(epoch FROM (r.logged_at - u.signed_up_at)) / 604800)::int AS week_no
  FROM kst_users u
  JOIN kst_records r ON r.user_id = u.id
)
SELECT
  date_trunc('week', u.signed_up_at)::date          AS "가입 주",
  count(DISTINCT u.id)                              AS "가입",
  count(DISTINCT a.user_id) FILTER (WHERE a.week_no = 0) AS "W0",
  count(DISTINCT a.user_id) FILTER (WHERE a.week_no = 1) AS "W1",
  count(DISTINCT a.user_id) FILTER (WHERE a.week_no = 2) AS "W2",
  count(DISTINCT a.user_id) FILTER (WHERE a.week_no = 3) AS "W3",
  count(DISTINCT a.user_id) FILTER (WHERE a.week_no >= 4) AS "W4+"
FROM kst_users u
LEFT JOIN activity a ON a.user_id = u.id
GROUP BY 1
ORDER BY 1;

-- ── 3. 기록 타입 분포 ────────────────────────────────────────────────────────
-- 어떤 항목을 실제로 쓰는가. 안 쓰이는 타입은 입력 화면에서 빼고,
-- 쏠린 타입 주변으로 항목을 늘린다.

\echo ''
\echo '=== 3. 기록 타입 분포 ==='
SELECT
  type                        AS "타입",
  count(*)                    AS "건수",
  count(DISTINCT user_id)     AS "사용자",
  round(100.0 * count(*) / NULLIF(sum(count(*)) OVER (), 0), 1) AS "비중%"
FROM kst_records
GROUP BY type
ORDER BY 2 DESC;

-- ── 4. 지속 사용자는 무엇을 기록하는가 ──────────────────────────────────────
-- 만성질환 가설 검증. 30일 넘게 기록한 사람의 타입 분포가 전체(쿼리 3)와
-- 다르면 — 특히 symptom/vomit/weight 쪽으로 쏠리면 — 타겟을 좁힐 근거가 된다.

\echo ''
\echo '=== 4. 30일 이상 지속 사용자의 기록 타입 ==='
SELECT
  r.type                      AS "타입",
  count(*)                    AS "건수",
  count(DISTINCT r.user_id)   AS "사용자"
FROM kst_records r
JOIN per_user pu ON pu.id = r.user_id
WHERE pu.lifespan_days >= 30
GROUP BY r.type
ORDER BY 2 DESC;

\echo ''
\echo '=== 4b. 상위 사용자 (개인 식별자 없이 활동량만) ==='
SELECT
  signed_up_at::date  AS "가입일",
  pets                AS "반려동물",
  records             AS "기록",
  active_days         AS "기록한 날",
  lifespan_days       AS "지속일",
  last_logged_on      AS "마지막 기록",
  withdrawn           AS "탈퇴"
FROM per_user
ORDER BY active_days DESC NULLS LAST, records DESC
LIMIT 20;

-- ── 5. AI 리포트 사용률 ──────────────────────────────────────────────────────
-- 핵심 차별화 기능을 실제로 쓰는가. 월 1회 무료 쿼터를 다 쓰는 사람이 없으면
-- 유료화 논의는 아직 이르다.

\echo ''
\echo '=== 5. AI 리포트 ==='
SELECT
  rp.status                                   AS "상태",
  count(*)                                    AS "건수",
  count(DISTINCT p.user_id)                   AS "사용자",
  count(*) FILTER (WHERE rs.id IS NOT NULL)   AS "공유 설정됨"
FROM reports rp
JOIN pets p ON p.id = rp.pet_id
LEFT JOIN report_shares rs ON rs.report_id = rp.id
JOIN kst_users u ON u.id = p.user_id
GROUP BY rp.status
ORDER BY 2 DESC;
