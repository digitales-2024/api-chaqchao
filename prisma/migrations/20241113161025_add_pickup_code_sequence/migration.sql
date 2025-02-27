-- CreateTable
CREATE TABLE "PickupCodeSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PickupCodeSequence_pkey" PRIMARY KEY ("id")
);
