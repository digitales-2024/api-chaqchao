-- CreateEnum
CREATE TYPE "ClassTypeUser" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "TypeCurrency" AS ENUM ('SOL', 'DOLAR');

-- CreateTable
CREATE TABLE "ClassPriceConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "classTypeUser" "ClassTypeUser" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "typeCurrency" "TypeCurrency" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassPriceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassLanguage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegistrationConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "closeBeforeStartInterval" INTEGER NOT NULL,
    "finalRegistrationCloseInterval" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRegistrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassPriceConfig_id_key" ON "ClassPriceConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_id_key" ON "ClassSchedule"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassLanguage_id_key" ON "ClassLanguage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegistrationConfig_id_key" ON "ClassRegistrationConfig"("id");

-- AddForeignKey
ALTER TABLE "ClassPriceConfig" ADD CONSTRAINT "ClassPriceConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassLanguage" ADD CONSTRAINT "ClassLanguage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistrationConfig" ADD CONSTRAINT "ClassRegistrationConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
