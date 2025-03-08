/*
  Warnings:

  - You are about to drop the column `detail` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `nilai` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `taskPeriode` on the `records` table. All the data in the column will be lost.
  - Added the required column `taskList` to the `Records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `records` DROP COLUMN `detail`,
    DROP COLUMN `nilai`,
    DROP COLUMN `taskPeriode`,
    ADD COLUMN `taskList` JSON NOT NULL,
    ADD COLUMN `value` DOUBLE NOT NULL;
