-- Add Milestones (deliverables) + Activity Feed + View Tracking

CREATE TABLE `ordermilestone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `coverUrl` VARCHAR(191) NULL,
    `category` ENUM('DESIGN', 'FRONTEND', 'BACKEND', 'COPY', 'CONTENT', 'REVIEW', 'ASSET', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `status` ENUM('DRAFT', 'READY', 'IN_REVIEW', 'REVISION_NEEDED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'READY',
    `notifyClient` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NOT NULL,
    `viewedAt` DATETIME(3) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ordermilestone_orderId_idx`(`orderId`),
    INDEX `ordermilestone_status_idx`(`status`),
    INDEX `ordermilestone_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `milestoneview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `milestoneId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `milestoneview_milestoneId_userId_key`(`milestoneId`, `userId`),
    INDEX `milestoneview_milestoneId_idx`(`milestoneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `orderactivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` VARCHAR(191) NOT NULL,
    `actorId` INTEGER NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `orderactivity_orderId_idx`(`orderId`),
    INDEX `orderactivity_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ordermilestone`
    ADD CONSTRAINT `ordermilestone_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ordermilestone`
    ADD CONSTRAINT `ordermilestone_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `milestoneview`
    ADD CONSTRAINT `milestoneview_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `ordermilestone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `milestoneview`
    ADD CONSTRAINT `milestoneview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `orderactivity`
    ADD CONSTRAINT `orderactivity_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `orderactivity`
    ADD CONSTRAINT `orderactivity_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
