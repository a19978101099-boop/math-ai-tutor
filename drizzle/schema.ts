import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Problems table: stores uploaded math problems with images and extracted steps
 */
export const problems = mysqlTable("problems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  /** Extracted Chinese text from problem image (with LaTeX for math formulas) */
  problemText: text("problemText"),
  /** Extracted English text from problem image (with LaTeX for math formulas) */
  problemTextEn: text("problemTextEn"),
  problemImageUrl: text("problemImageUrl"),
  problemImageKey: text("problemImageKey"),
  solutionImageUrl: text("solutionImageUrl"),
  solutionImageKey: text("solutionImageKey"),
  /** JSON array of step objects: [{id: string, text: string}] */
  steps: text("steps").notNull(),
  /** JSON array of condition strings: ["∠ABC = ∠AED", "AB = AE"] */
  conditions: text("conditions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Problem = typeof problems.$inferSelect;
export type InsertProblem = typeof problems.$inferInsert;

/**
 * User progress table: tracks learning activities
 */
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  problemId: int("problemId").notNull(),
  /** Number of times the user viewed this problem */
  viewCount: int("viewCount").default(0).notNull(),
  /** Number of times the user requested hints for steps */
  hintCount: int("hintCount").default(0).notNull(),
  /** Number of times the user clicked on conditions */
  conditionClickCount: int("conditionClickCount").default(0).notNull(),
  /** Number of steps revealed by the user */
  stepsRevealed: int("stepsRevealed").default(0).notNull(),
  /** Whether the user has viewed the complete solution */
  viewedSolution: int("viewedSolution").default(0).notNull(),
  firstViewedAt: timestamp("firstViewedAt").defaultNow().notNull(),
  lastViewedAt: timestamp("lastViewedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;