/*
  Warnings:

  - Added the required column `instrument` to the `Records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `records` ADD COLUMN `instrument` VARCHAR(191) NOT NULL;
