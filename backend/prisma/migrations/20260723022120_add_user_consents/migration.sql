-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('termsOfService', 'privacyPolicy', 'marketingNotification');

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "policy_version" TEXT NOT NULL,
    "agreed" BOOLEAN NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_consents_user_id_consent_type_created_at_idx" ON "user_consents"("user_id", "consent_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint
-- 필수 항목(termsOfService, privacyPolicy)은 agreed=false 행이 존재할 수 없다.
-- (consent_type = 'marketingNotification' OR agreed = true) 형태여야 한다: consent_type이
-- marketingNotification이면 agreed 값과 무관하게 통과시키고(선택 동의는 거부 가능해야 함),
-- 그 외 타입(termsOfService/privacyPolicy)은 agreed = true인 경우에만 통과시킨다.
-- Prisma 6.19.3은 @@check를 지원하지 않아(schema validate 시 "Attribute not known: @check" 에러)
-- 스키마에는 표현하지 않고 여기서만 적용한다 (Postgres 레벨에서는 여전히 강제된다).
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_required_agreed_check"
  CHECK ("consent_type" = 'marketingNotification' OR "agreed" = true);

-- DataMigration
-- 기존 어드민 계정(가입 동의 플로우가 생기기 전에 생성된 계정)에 대한 소급 시드.
-- 실사용자는 아직 없고 어드민 계정 1개만 존재하는 시점에 적용한다.
INSERT INTO "user_consents" ("id", "user_id", "consent_type", "policy_version", "agreed", "created_at")
SELECT gen_random_uuid(), "id", 'termsOfService', 'pre-consent-migration', true, "created_at" FROM "users";
INSERT INTO "user_consents" ("id", "user_id", "consent_type", "policy_version", "agreed", "created_at")
SELECT gen_random_uuid(), "id", 'privacyPolicy', 'pre-consent-migration', true, "created_at" FROM "users";
