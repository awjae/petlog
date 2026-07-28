-- Petlog 애플리케이션 DB 롤 부트스트랩
--
-- ## 왜 이 파일이 필요한가
-- 원래 백엔드 런타임은 RDS 마스터 유저(`petlog`)로 DB에 접속했다. 그런데 마스터 비밀번호는
-- `manageMasterUserPassword: true`(database-stack.ts) 때문에 AWS가 7일마다 강제로 로테이션한다.
-- SSM에 담긴 DATABASE_URL은 배포 시점에만 갱신되므로, 로테이션이 돌면 그 즉시 stale해져
-- 백엔드가 `P1000 Authentication failed`로 죽는다 (2026-07-27 00:09 로테이션 → 00:10 장애).
--
-- 런타임을 로테이션에서 떼어내는 것이 이 파일의 목적이다. 애플리케이션 전용 롤을 따로 만들면
-- 그 비밀번호는 AWS가 건드리지 않으므로 마스터가 아무리 로테이션돼도 런타임은 영향받지 않는다.
--
-- ## 롤 구성
-- - `petlog_migrator` : `prisma migrate deploy` 전용. 스키마 객체를 소유하고 DDL을 수행한다.
-- - `petlog_app`      : 백엔드 런타임 전용. DML만 가능하고 DDL 권한이 없다.
--
-- 앱 롤에 DDL이 없다는 게 실질적인 이득이다 — 앱 경로로 들어온 어떤 버그나 인젝션도
-- 테이블을 변경하거나 삭제할 수 없다.
--
-- ## 실행 방법
-- 직접 psql로 실행하지 않는다. `infra/scripts/bootstrap-db-roles.sh`가 VPC 내부 일회성 ECS
-- 태스크로 이 파일을 실행한다 (RDS가 private 서브넷에 있어 로컬에서 직접 접근할 수 없다).
-- 비밀번호는 그 태스크 안에서 생성되어 SSM SecureString에 저장되므로, 로컬 셸이나
-- CloudTrail, terraform state 어디에도 평문으로 남지 않는다.
--
-- ## 멱등성
-- 여러 번 실행해도 안전하다. 롤이 없으면 만들고, 있으면 비밀번호만 갱신한다.
-- 소유권 이전과 GRANT는 모두 반복 실행에 안전한 형태로 작성했다.
--
-- psql 변수 `app_password` / `migrator_password`는 실행 스크립트가 주입한다.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- 1) 롤 생성
-- ---------------------------------------------------------------------------
-- CREATE ROLE은 IF NOT EXISTS를 지원하지 않으므로 DO 블록으로 감싼다.
-- 비밀번호는 여기서 설정하지 않는다 — psql은 dollar-quoted 블록 안에서도 `:'var'`를
-- 치환하기 때문에, 블록 안에 넣으면 인용 처리가 예측하기 어려워진다. 아래 ALTER ROLE에서
-- 별도로 설정한다(생성/갱신 경로가 하나로 합쳐져 멱등성도 함께 얻는다).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'petlog_migrator') THEN
    CREATE ROLE petlog_migrator LOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'petlog_app') THEN
    CREATE ROLE petlog_app LOGIN;
  END IF;
END
$$;

-- 커넥션 상한을 걸어 한쪽이 커넥션을 소진해도 다른 쪽과 긴급 접속용 여유가 남게 한다.
-- db.t4g.micro의 max_connections는 약 112다.
ALTER ROLE petlog_migrator WITH LOGIN PASSWORD :'migrator_password' CONNECTION LIMIT 5;
ALTER ROLE petlog_app      WITH LOGIN PASSWORD :'app_password'      CONNECTION LIMIT 40;

-- ---------------------------------------------------------------------------
-- 2) 기존 객체 소유권을 마스터 → petlog_migrator 로 이전
-- ---------------------------------------------------------------------------
-- ALTER TABLE / DROP TABLE은 GRANT로는 안 되고 소유자만 할 수 있다. 지금까지 마스터
-- 유저가 만든 테이블/시퀀스/enum 타입/`_prisma_migrations`를 migrator가 소유해야
-- 앞으로의 마이그레이션이 동작한다.
--
-- REASSIGN OWNED를 실행하려면 실행 주체(마스터)가 대상 롤의 멤버여야 한다.
GRANT petlog_migrator TO petlog;

-- 현재 데이터베이스 안에서 petlog가 소유한 모든 객체를 넘긴다. 두 번째 실행 시에는
-- 넘길 객체가 없어 아무 일도 일어나지 않는다.
REASSIGN OWNED BY petlog TO petlog_migrator;

-- REASSIGN OWNED는 데이터베이스 같은 "공유 객체"의 소유권까지 함께 옮긴다. DB 자체는
-- 마스터가 계속 소유하는 편이 운영상 덜 헷갈리므로 되돌린다.
ALTER DATABASE petlog OWNER TO petlog;

-- PostgreSQL 15부터 public 스키마는 PUBLIC에게 CREATE를 주지 않는다. 소유자를 migrator로
-- 바꿔두면 migrator만 스키마에 객체를 만들 수 있고 app은 만들 수 없다.
ALTER SCHEMA public OWNER TO petlog_migrator;

-- ---------------------------------------------------------------------------
-- 3) 앱 롤 권한 — DML만
-- ---------------------------------------------------------------------------
GRANT CONNECT ON DATABASE petlog TO petlog_app;
GRANT USAGE   ON SCHEMA   public TO petlog_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO petlog_app;
GRANT USAGE,  SELECT                 ON ALL SEQUENCES IN SCHEMA public TO petlog_app;

-- ---------------------------------------------------------------------------
-- 4) 앞으로 생길 객체에도 자동 적용
-- ---------------------------------------------------------------------------
-- 3)의 `ON ALL TABLES`는 "지금 존재하는" 테이블에만 적용된다. 이 블록이 없으면 다음
-- 마이그레이션이 새 테이블을 만드는 순간 앱이 그 테이블만 읽지 못한다 — 배포 직후가 아니라
-- 다음 스키마 변경 때 터지므로 원인 추적이 특히 어렵다. 반드시 함께 걸어둔다.
ALTER DEFAULT PRIVILEGES FOR ROLE petlog_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO petlog_app;

ALTER DEFAULT PRIVILEGES FOR ROLE petlog_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO petlog_app;

-- ---------------------------------------------------------------------------
-- 5) 결과 확인 (실행 로그에 남는다)
-- ---------------------------------------------------------------------------
SELECT rolname, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('petlog', 'petlog_app', 'petlog_migrator')
ORDER BY rolname;

SELECT nspname AS schema, pg_get_userbyid(nspowner) AS owner
FROM pg_namespace
WHERE nspname = 'public';

-- app 롤이 DDL을 못 하는지 확인한다 (기대값: f).
SELECT has_schema_privilege('petlog_app', 'public', 'CREATE') AS app_can_create_in_public;
