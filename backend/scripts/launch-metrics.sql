-- 유료화 착수 판단 지표 3종 (출시 후 로드맵 Phase 3 트리거)
--
--   1) 기록을 1건 이상 남긴 주간 활성 사용자 300명 이상, 2주 연속
--   2) 가입 4주차 재방문율 20% 이상
--   3) 활성 반려동물의 30% 이상이 월간 리포트 생성
--
-- 세 조건이 동시에 충족되기 전에는 결제 모듈을 만들지 않는다.
-- 조회 전용 쿼리다. 날짜는 모두 KST 기준으로 자른다(DB는 UTC timestamp로 저장).
--
-- 실행:
--   infra/scripts/db-tunnel.sh   # bastion 경유로 localhost:15432 → RDS
--   psql "<DATABASE_URL, 호스트만 localhost:15432로>" -f backend/scripts/launch-metrics.sql
--   (자격증명은 infra/README.md "접속 자격증명 확인" 참고)


-- 1) 주간 기록 활성 사용자
--
-- recorded_at이 아니라 created_at으로 센다. recorded_at은 사용자가 과거 날짜로 고를 수
-- 있어서 "그 주에 앱을 써서 기록했다"는 신호가 아니다.
SELECT
  date_trunc('week', hr.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date AS week_kst,
  count(DISTINCT p.user_id) AS recording_users
FROM health_records hr
JOIN pets p ON p.id = hr.pet_id
JOIN users u ON u.id = p.user_id
WHERE hr.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND u.deletion_requested_at IS NULL
  AND u.anonymized_at IS NULL
GROUP BY 1
ORDER BY 1;


-- 2) 가입 주 코호트별 4주차(가입 후 21~27일) 재방문율
--
-- 방문 신호로 refresh_tokens.created_at을 쓴다. 별도 방문 로그 없이 이 값이 쓸 만한 이유:
--   - 액세스 토큰 수명이 15분이라(auth.service.ts JWT_EXPIRES_IN) 15분 넘게 쉬었다가 앱을
--     열면 첫 요청에서 /auth/refresh가 호출되고(errorLink.ts), 그때마다 행이 새로 생긴다
--   - 회전된 토큰은 revoked_at만 채우고 지우지 않는다(행 삭제 코드 없음)
-- 기록 없이 둘러보기만 한 방문도 잡힌다. 여기에 기록 생성 시각을 합친다.
--
-- 4주차가 아직 끝나지 않은 코호트(가입 28일 미만)는 분모를 왜곡하므로 뺀다.
WITH cohort AS (
  SELECT
    id AS user_id,
    created_at AS signed_up_at,
    date_trunc('week', created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date AS cohort_week_kst
  FROM users
  WHERE created_at <= (now() AT TIME ZONE 'UTC') - interval '28 days'
),
activity AS (
  SELECT user_id, created_at AS active_at FROM refresh_tokens
  UNION ALL
  SELECT p.user_id, hr.created_at FROM health_records hr JOIN pets p ON p.id = hr.pet_id
),
returned AS (
  SELECT DISTINCT c.user_id
  FROM cohort c
  JOIN activity a ON a.user_id = c.user_id
  WHERE a.active_at >= c.signed_up_at + interval '21 days'
    AND a.active_at < c.signed_up_at + interval '28 days'
)
SELECT
  c.cohort_week_kst,
  count(*) AS signups,
  count(r.user_id) AS week4_returned,
  round(100.0 * count(r.user_id) / count(*), 1) AS week4_retention_pct
FROM cohort c
LEFT JOIN returned r ON r.user_id = c.user_id
GROUP BY 1
ORDER BY 1;


-- 3) 월별 활성 반려동물 중 리포트 생성 비율
--
-- 활성 = 그달에 기록이 1건 이상 생성된 반려동물. 로드맵 기준은 "생성/열람"인데 리포트 조회
-- 로그가 없어 열람은 셀 수 없다. 생성 완료(completed)만 센다.
WITH active_pets AS (
  SELECT DISTINCT
    date_trunc('month', hr.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date AS month_kst,
    hr.pet_id
  FROM health_records hr
  JOIN pets p ON p.id = hr.pet_id
  WHERE hr.deleted_at IS NULL
    AND p.deleted_at IS NULL
),
report_pets AS (
  SELECT DISTINCT
    date_trunc('month', created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date AS month_kst,
    pet_id
  FROM reports
  WHERE status = 'completed'
)
SELECT
  ap.month_kst,
  count(*) AS active_pets,
  count(rp.pet_id) AS pets_with_report,
  round(100.0 * count(rp.pet_id) / count(*), 1) AS report_rate_pct
FROM active_pets ap
LEFT JOIN report_pets rp ON rp.month_kst = ap.month_kst AND rp.pet_id = ap.pet_id
GROUP BY 1
ORDER BY 1;
