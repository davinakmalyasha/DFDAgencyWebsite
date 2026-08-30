-- Extend user table with CLIENT invite / soft-delete / lead link
ALTER TABLE `user`
    ADD COLUMN `inviteToken` VARCHAR(191) NULL,
    ADD COLUMN `inviteTokenExpiry` DATETIME(3) NULL,
    ADD COLUMN `leadId` INTEGER NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `user_inviteToken_key` ON `user`(`inviteToken`);
CREATE UNIQUE INDEX `user_leadId_key` ON `user`(`leadId`);
CREATE INDEX `user_inviteTokenExpiry_idx` ON `user`(`inviteTokenExpiry`);

ALTER TABLE `user`
    ADD CONSTRAINT `user_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend order table with progress step + drive folder
ALTER TABLE `order`
    ADD COLUMN `currentStep` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `driveFolderId` VARCHAR(191) NULL,
    ADD COLUMN `driveFolderUrl` VARCHAR(191) NULL;

-- Migrate existing userRole enum to add CLIENT
ALTER TABLE `user`
    MODIFY COLUMN `role` ENUM('SUPERADMIN', 'EDITOR', 'CLIENT') NOT NULL DEFAULT 'EDITOR';

-- CreateTable clientrequest
CREATE TABLE `clientrequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `type` ENUM('ACCESS', 'FILE', 'MEETING', 'REVISION', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNote` TEXT NULL,
    `driveUrl` VARCHAR(191) NULL,
    `calendlyEventUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `clientrequest_userId_idx`(`userId`),
    INDEX `clientrequest_orderId_idx`(`orderId`),
    INDEX `clientrequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `clientrequest`
    ADD CONSTRAINT `clientrequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `clientrequest_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable contract
CREATE TABLE `contract` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `signedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `contract_orderId_key`(`orderId`),
    INDEX `contract_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `contract`
    ADD CONSTRAINT `contract_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `contract_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
