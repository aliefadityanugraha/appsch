/*
  Warnings:

  - You are about to drop the column `instrument` on the `records` table. All the data in the column will be lost.
  - Added the required column `taskPeriode` to the `Records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `records` DROP COLUMN `instrument`,
    ADD COLUMN `taskPeriode` VARCHAR(191) NOT NULL;
