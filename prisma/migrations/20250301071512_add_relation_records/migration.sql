-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_recordsId_fkey`;

-- DropIndex
DROP INDEX `Task_recordsId_fkey` ON `task`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_recordsId_fkey` FOREIGN KEY (`recordsId`) REFERENCES `Records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
