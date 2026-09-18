-- AlterEnum
-- 값 3개를 한 마이그레이션에서 추가한다. PostgreSQL 11 이하에서는 불가능하지만
-- 로컬(postgres:16-alpine)과 RDS(infra/stacks/database-stack.ts:105, engineVersion '16')
-- 모두 16이므로 문제되지 않는다.
ALTER TYPE "HealthRecordType" ADD VALUE 'glucose';
ALTER TYPE "HealthRecordType" ADD VALUE 'temperature';
ALTER TYPE "HealthRecordType" ADD VALUE 'waterIntake';
