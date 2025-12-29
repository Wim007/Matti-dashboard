CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appName` enum('matti','opvoedmaatje') NOT NULL,
	`timestamp` timestamp NOT NULL,
	`postalCodeArea` varchar(20) NOT NULL,
	`ageGroup` varchar(20) NOT NULL,
	`userType` enum('jongere','ouder') NOT NULL,
	`familyType` enum('eenouder','tweeouder','samengesteld'),
	`themes` json NOT NULL,
	`sessionDuration` int NOT NULL,
	`messageCount` int NOT NULL,
	`isReturningUser` boolean NOT NULL,
	`weeklyFrequency` int NOT NULL,
	`referralType` enum('jeugd-ggz','wijkteam','huisarts','schuldhulp','veilig-thuis'),
	`daysToReferral` int,
	`satisfactionScore` int,
	`selfReportedImprovement` boolean,
	`isHighRisk` boolean NOT NULL,
	`safetySignal` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`appName` enum('matti','opvoedmaatje') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;