-- CreateTable
CREATE TABLE `user_preferences` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `displayMode` VARCHAR(191) NOT NULL DEFAULT 'grid',
    `show_completed_items` BOOLEAN NOT NULL DEFAULT true,
    `show_countdown` BOOLEAN NOT NULL DEFAULT true,
    `show_progress_bars` BOOLEAN NOT NULL DEFAULT true,
    `email_notifications` BOOLEAN NOT NULL DEFAULT true,
    `push_notifications` BOOLEAN NOT NULL DEFAULT true,
    `reminder_notifications` BOOLEAN NOT NULL DEFAULT true,
    `task_due_reminders` BOOLEAN NOT NULL DEFAULT true,
    `holiday_countdown_alerts` BOOLEAN NOT NULL DEFAULT true,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `locale` VARCHAR(191) NOT NULL DEFAULT 'en-US',
    `reduced_motion` BOOLEAN NOT NULL DEFAULT false,
    `high_contrast` BOOLEAN NOT NULL DEFAULT false,
    `font_size` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preferences_user_id_key`(`user_id`),
    INDEX `user_preferences_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
