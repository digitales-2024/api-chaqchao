-- CreateTable
CREATE TABLE "CapacityClass" (
    "id" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "minCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapacityClass_id_key" ON "CapacityClass"("id");
