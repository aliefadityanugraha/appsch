/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `role`,
    ADD COLUMN `roleId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
