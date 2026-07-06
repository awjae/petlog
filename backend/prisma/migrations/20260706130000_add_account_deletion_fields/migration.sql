-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletion_requested_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "anonymized_at" TIMESTAMP(3);

-- CreateIndex (배치 작업이 나중에 쓸 partial index — 지금은 쓰이지 않지만 스키마 설계에 포함되어 있으므로 함께 만든다)
CREATE INDEX "idx_users_pending_anonymization"
    ON "users" ("deletion_requested_at")
    WHERE "deletion_requested_at" IS NOT NULL AND "anonymized_at" IS NULL;
