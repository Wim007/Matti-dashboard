ALTER TABLE `analytics_events` ADD `initialConcern` varchar(255);--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `outcomeStatus` enum('ongoing','improved','resolved','escalated');--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `actionsCompleted` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `interventionDays` int;