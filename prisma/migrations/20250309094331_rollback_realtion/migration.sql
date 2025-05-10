/*
  Warnings:

  - You are about to drop the column `roleId` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropIndex
DROP INDEX `User_roleId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `roleId`,
    ADD COLUMN `role` INTEGER NOT NULL DEFAULT 1;
