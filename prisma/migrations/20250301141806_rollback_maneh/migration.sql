/*
  Warnings:

  - You are about to drop the column `recordsId` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_recordsId_fkey`;

-- DropIndex
DROP INDEX `Task_recordsId_fkey` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `recordsId`;
