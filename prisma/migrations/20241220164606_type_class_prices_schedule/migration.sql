-- AlterTable
ALTER TABLE "ClassPriceConfig" ADD COLUMN     "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "ClassSchedule" ADD COLUMN     "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL';
