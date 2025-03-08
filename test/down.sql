-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_recordsId_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_periodeId_fkey`;

-- DropForeignKey
ALTER TABLE `Records` DROP FOREIGN KEY `Records_staffId_fkey`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `Role`;

-- DropTable
DROP TABLE `Periode`;

-- DropTable
DROP TABLE `Staff`;

-- DropTable
DROP TABLE `Task`;

-- DropTable
DROP TABLE `Records`;

-- DropTable
DROP TABLE `Settings`;

-- CreateTable
CREATE TABLE `periode` (
    `id` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `nilai` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Periode_id_key`(`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `records` (
    `id` VARCHAR(191) NOT NULL,
    `nilai` DOUBLE NOT NULL,
    `detail` LONGTEXT NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `taskPeriode` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Records_id_key`(`id` ASC),
    INDEX `Records_staffId_fkey`(`staffId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `permission` LONGTEXT NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Role_id_key`(`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `tunjangan` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `jabatan` VARCHAR(191) NOT NULL,
    `nip` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tunjangan` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Staff_id_key`(`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task` (
    `id` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `nilai` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `staffId` VARCHAR(191) NOT NULL,
    `periodeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordsId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Task_id_key`(`id` ASC),
    INDEX `Task_periodeId_fkey`(`periodeId` ASC),
    INDEX `Task_recordsId_fkey`(`recordsId` ASC),
    INDEX `Task_staffId_fkey`(`staffId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role` INTEGER NOT NULL DEFAULT 1,
    `status` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `User_email_key`(`email` ASC),
    UNIQUE INDEX `User_id_key`(`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `records` ADD CONSTRAINT `Records_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `Task_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `periode`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `Task_recordsId_fkey` FOREIGN KEY (`recordsId`) REFERENCES `records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `Task_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

