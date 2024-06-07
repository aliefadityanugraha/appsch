/*
  Warnings:

  - You are about to drop the `instrument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `instrument`;

-- CreateTable
CREATE TABLE `Periode` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `nilai` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Periode_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
