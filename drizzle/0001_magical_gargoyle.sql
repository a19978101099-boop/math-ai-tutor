CREATE TABLE `problems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`problemImageUrl` text,
	`problemImageKey` text,
	`solutionImageUrl` text,
	`solutionImageKey` text,
	`steps` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problems_id` PRIMARY KEY(`id`)
);
