/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Rol` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Rol` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `UserRol` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `UserRol` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- DropForeignKey
ALTER TABLE "Rol" DROP CONSTRAINT "Rol_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Rol" DROP CONSTRAINT "Rol_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserRol" DROP CONSTRAINT "UserRol_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "UserRol" DROP CONSTRAINT "UserRol_updatedBy_fkey";

-- AlterTable
ALTER TABLE "Rol" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "UserRol" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" "AuditActionType" NOT NULL,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_id_key" ON "Audit"("id");

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
