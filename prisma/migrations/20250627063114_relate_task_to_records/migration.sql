/*
  Warnings:

  - You are about to drop the column `taskList` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `deskripsi` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `nilai` on the `task` table. All the data in the column will be lost.
  - Added the required column `description` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `records` DROP COLUMN `taskList`,
    ADD PRIMARY KEY (`id`);

-- DropIndex
DROP INDEX `Records_id_key` ON `records`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `deskripsi`,
    DROP COLUMN `nilai`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `recordId` VARCHAR(191) NULL,
    ADD COLUMN `value` DOUBLE NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropIndex
DROP INDEX `Task_id_key` ON `task`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `Records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
