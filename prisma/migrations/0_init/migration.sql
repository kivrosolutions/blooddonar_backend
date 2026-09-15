-- CreateTable
CREATE TABLE `donors` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `cnicNumber` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `profileImage` VARCHAR(191) NULL,
    `profileImageFileId` VARCHAR(191) NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerificationToken` VARCHAR(191) NULL,
    `emailVerificationExpires` DATETIME(3) NULL,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerificationToken` VARCHAR(191) NULL,
    `phoneVerificationExpires` DATETIME(3) NULL,
    `passwordResetToken` VARCHAR(191) NULL,
    `passwordResetExpires` DATETIME(3) NULL,
    `bloodGroup` ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE') NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT false,
    `isProfileCompleted` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `agreedToTermsAt` DATETIME(3) NULL,
    `lastDonationDate` DATETIME(3) NULL,
    `totalDonations` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `fcmToken` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `donors_phone_key`(`phone`),
    UNIQUE INDEX `donors_email_key`(`email`),
    UNIQUE INDEX `donors_cnicNumber_key`(`cnicNumber`),
    INDEX `donors_city_idx`(`city`),
    INDEX `donors_bloodGroup_city_idx`(`bloodGroup`, `city`),
    INDEX `donors_isAvailable_idx`(`isAvailable`),
    INDEX `donors_isVerified_idx`(`isVerified`),
    INDEX `donors_phone_idx`(`phone`),
    INDEX `donors_deletedAt_createdAt_idx`(`deletedAt`, `createdAt`),
    INDEX `donors_deletedAt_city_idx`(`deletedAt`, `city`),
    INDEX `donors_deletedAt_bloodGroup_idx`(`deletedAt`, `bloodGroup`),
    INDEX `donors_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `donors_deletedAt_latitude_longitude_idx`(`deletedAt`, `latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donor_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `donorId` VARCHAR(191) NOT NULL,
    `refreshTokenHash` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `deviceName` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `donor_sessions_donorId_idx`(`donorId`),
    INDEX `donor_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donor_documents` (
    `id` VARCHAR(191) NOT NULL,
    `donorId` VARCHAR(191) NOT NULL,
    `type` ENUM('CNIC_FRONT', 'CNIC_BACK') NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `donor_documents_donorId_idx`(`donorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blood_test_reports` (
    `id` VARCHAR(191) NOT NULL,
    `donorId` VARCHAR(191) NOT NULL,
    `reportUrl` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `bloodGroup` ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE') NOT NULL,
    `labName` VARCHAR(191) NULL,
    `hemoglobinLevel` DOUBLE NULL,
    `testedAt` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',

    INDEX `blood_test_reports_donorId_idx`(`donorId`),
    INDEX `blood_test_reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blood_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requesterName` VARCHAR(191) NOT NULL,
    `requesterPhone` VARCHAR(191) NOT NULL,
    `requesterEmail` VARCHAR(191) NOT NULL,
    `patientName` VARCHAR(191) NULL,
    `hospitalName` VARCHAR(191) NULL,
    `bloodGroup` ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE') NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `unitsRequired` INTEGER NOT NULL DEFAULT 1,
    `requiredByDate` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONTACTED', 'FULFILLED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `fulfilledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `blood_requests_bloodGroup_city_idx`(`bloodGroup`, `city`),
    INDEX `blood_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` VARCHAR(191) NOT NULL,
    `donorId` VARCHAR(191) NOT NULL,
    `type` ENUM('CONFIRMATION', 'REMINDER', 'CONGRATULATIONS', 'PASSWORD_RESET', 'VERIFICATION') NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` ENUM('SENT', 'FAILED', 'BOUNCED') NOT NULL DEFAULT 'SENT',
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `email_logs_donorId_idx`(`donorId`),
    INDEX `email_logs_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `donor_sessions` ADD CONSTRAINT `donor_sessions_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donor_documents` ADD CONSTRAINT `donor_documents_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blood_test_reports` ADD CONSTRAINT `blood_test_reports_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_logs` ADD CONSTRAINT `email_logs_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
