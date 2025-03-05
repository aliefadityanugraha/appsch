/*
  Warnings:

  - Added the required column `recordsId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `task` ADD COLUMN `recordsId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_recordsId_fkey` FOREIGN KEY (`recordsId`) REFERENCES `Records`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
