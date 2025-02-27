-- CreateTable
CREATE TABLE "Classes" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "scheduleClass" TEXT NOT NULL,
    "dateClass" TIMESTAMP(3) NOT NULL,
    "totalParticipants" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classes_id_key" ON "Classes"("id");
