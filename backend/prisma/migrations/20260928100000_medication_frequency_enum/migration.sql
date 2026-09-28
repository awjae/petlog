-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('onceDaily', 'twiceDaily', 'threeTimesDaily', 'asNeeded');

-- AlterTable
-- 기존 값은 투약 폼 선택지(하루 1회/2회/3회/필요시)로만 저장됐다. 목록에 없는 값은 NULL로
-- 버리지 않고 그대로 enum 캐스트에 넘겨 마이그레이션을 실패시킨다 — 예상 밖 데이터를
-- 조용히 잃는 것보다 배포가 멈추는 편이 낫다.
ALTER TABLE "medications" ALTER COLUMN "frequency" TYPE "MedicationFrequency" USING (
  CASE "frequency"
    WHEN '하루 1회' THEN 'onceDaily'
    WHEN '하루 2회' THEN 'twiceDaily'
    WHEN '하루 3회' THEN 'threeTimesDaily'
    WHEN '필요시' THEN 'asNeeded'
    ELSE "frequency"
  END
)::"MedicationFrequency";
