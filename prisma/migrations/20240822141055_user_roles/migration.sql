/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Module_Permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Module_Permissions` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Permission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Module_Permissions" DROP CONSTRAINT "Module_Permissions_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Module_Permissions" DROP CONSTRAINT "Module_Permissions_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_updatedBy_fkey";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "Module_Permissions" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";
