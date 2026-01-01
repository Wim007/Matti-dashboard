CREATE TABLE `cost_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careType` varchar(100) NOT NULL,
	`costAmount` int NOT NULL,
	`description` text,
	`updatedBy` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `cost_config_careType_unique` UNIQUE(`careType`)
);
--> statement-breakpoint
CREATE TABLE `improvement_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`theme` varchar(100) NOT NULL,
	`scoreStart` int NOT NULL,
	`scoreCurrent` int,
	`measuredAt` timestamp NOT NULL,
	`followUpAt` timestamp,
	`appName` enum('matti','opvoedmaatje') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `improvement_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`hadReferral` boolean NOT NULL,
	`preventedCareType` enum('jeugd_ggz','veilig_thuis','specialistische_zorg','uithuisplaatsing'),
	`appName` enum('matti','opvoedmaatje') NOT NULL,
	`trackedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cost_config` ADD CONSTRAINT `cost_config_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;