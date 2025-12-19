/*
  Warnings:

  - You are about to drop the column `frequency` on the `content_settings` table. All the data in the column will be lost.
  - You are about to drop the column `planningPeriod` on the `content_settings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- AlterTable
ALTER TABLE "content_settings" DROP COLUMN "frequency",
DROP COLUMN "planningPeriod",
ADD COLUMN     "postingDaysOfWeek" "DayOfWeek"[];
