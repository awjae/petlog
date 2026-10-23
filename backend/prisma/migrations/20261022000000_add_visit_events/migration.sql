-- CreateTable
CREATE TABLE "visit_events" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "utm_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_events_created_at_idx" ON "visit_events"("created_at");
