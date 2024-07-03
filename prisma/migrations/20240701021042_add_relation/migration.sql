/*
  Warnings:

  - Added the required column `tugasId` to the `Periode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `periode` ADD COLUMN `tugasId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Periode` ADD CONSTRAINT `Periode_tugasId_fkey` FOREIGN KEY (`tugasId`) REFERENCES `Tugas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
