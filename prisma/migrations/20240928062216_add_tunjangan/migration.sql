/*
  Warnings:

  - Added the required column `tunjangan` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `staff` ADD COLUMN `tunjangan` VARCHAR(191) NOT NULL;
