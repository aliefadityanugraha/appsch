-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_periodeId_fkey`;

-- DropIndex
DROP INDEX `Task_periodeId_fkey` ON `task`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `Periode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
