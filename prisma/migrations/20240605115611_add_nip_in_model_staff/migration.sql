/*
  Warnings:

  - Added the required column `nip` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `staff` ADD COLUMN `nip` VARCHAR(191) NOT NULL;
