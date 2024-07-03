/*
  Warnings:

  - You are about to alter the column `detail` on the `records` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `records` MODIFY `detail` JSON NOT NULL;
