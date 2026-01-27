CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`hintCount` int NOT NULL DEFAULT 0,
	`conditionClickCount` int NOT NULL DEFAULT 0,
	`stepsRevealed` int NOT NULL DEFAULT 0,
	`viewedSolution` int NOT NULL DEFAULT 0,
	`firstViewedAt` timestamp NOT NULL DEFAULT (now()),
	`lastViewedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`)
);
