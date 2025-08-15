/*
  Warnings:

  - You are about to drop the column `to_email` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the `InviteStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemberRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RSVPStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskPriority` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `invites_to_email_idx` ON `invites`;

-- AlterTable
ALTER TABLE `invites` DROP COLUMN `to_email`,
    ADD COLUMN `toEmail` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tasks` MODIFY `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low';

-- DropTable
DROP TABLE `InviteStatus`;

-- DropTable
DROP TABLE `MemberRole`;

-- DropTable
DROP TABLE `RSVPStatus`;

-- DropTable
DROP TABLE `TaskPriority`;

-- DropTable
DROP TABLE `TaskStatus`;

-- CreateIndex
CREATE INDEX `invites_toEmail_idx` ON `invites`(`toEmail`);
