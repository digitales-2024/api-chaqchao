-- CreateTable
CREATE TABLE "Classes" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "scheduleClass" TEXT NOT NULL,
    "languageClass" TEXT NOT NULL,
    "dateClass" TIMESTAMP(3) NOT NULL,
    "totalParticipants" INTEGER NOT NULL,
    "totalAdults" INTEGER NOT NULL,
    "totalChildren" INTEGER NOT NULL,
    "totalPriceAdults" DOUBLE PRECISION NOT NULL,
    "totalPriceChildren" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "typeCurrency" "TypeCurrency" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classes_id_key" ON "Classes"("id");
