/*
  Warnings:

  - You are about to drop the column `date` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `recordId` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_recordId_fkey`;

-- DropIndex
DROP INDEX `Task_recordId_fkey` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `date`,
    DROP COLUMN `recordId`;

-- CreateTable
CREATE TABLE `_RecordTasks` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_RecordTasks_AB_unique`(`A`, `B`),
    INDEX `_RecordTasks_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_RecordTasks` ADD CONSTRAINT `_RecordTasks_A_fkey` FOREIGN KEY (`A`) REFERENCES `Records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RecordTasks` ADD CONSTRAINT `_RecordTasks_B_fkey` FOREIGN KEY (`B`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
