import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, problems, InsertProblem, userProgress, InsertUserProgress } from "../drizzle/schema";
import { ENV } from './_core/env';
import { desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Problem queries
export async function createProblem(problem: InsertProblem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(problems).values(problem);
  return result[0].insertId;
}

export async function getProblemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
  return result[0];
}

export async function getUserProblems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(problems).where(eq(problems.userId, userId)).orderBy(desc(problems.createdAt));
}

// User progress queries
export async function getOrCreateProgress(userId: string, problemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Try to find existing progress
  const existing = await db
    .select()
    .from(userProgress)
    .where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.problemId, problemId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new progress record
  const result = await db.insert(userProgress).values({
    userId,
    problemId,
    viewCount: 0,
    hintCount: 0,
    conditionClickCount: 0,
    stepsRevealed: 0,
    viewedSolution: 0,
  });
  
  // Fetch the newly created record
  const newRecord = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.id, result[0].insertId))
    .limit(1);
  
  return newRecord[0];
}

export async function incrementViewCount(userId: string, problemId: number) {
  const db = await getDb();
  if (!db) return;
  
  const progress = await getOrCreateProgress(userId, problemId);
  await db
    .update(userProgress)
    .set({ viewCount: progress.viewCount + 1 })
    .where(eq(userProgress.id, progress.id));
}

export async function incrementHintCount(userId: string, problemId: number) {
  const db = await getDb();
  if (!db) return;
  
  const progress = await getOrCreateProgress(userId, problemId);
  await db
    .update(userProgress)
    .set({ hintCount: progress.hintCount + 1 })
    .where(eq(userProgress.id, progress.id));
}

export async function incrementConditionClickCount(userId: string, problemId: number) {
  const db = await getDb();
  if (!db) return;
  
  const progress = await getOrCreateProgress(userId, problemId);
  await db
    .update(userProgress)
    .set({ conditionClickCount: progress.conditionClickCount + 1 })
    .where(eq(userProgress.id, progress.id));
}

export async function updateStepsRevealed(userId: string, problemId: number, count: number) {
  const db = await getDb();
  if (!db) return;
  
  const progress = await getOrCreateProgress(userId, problemId);
  if (count > progress.stepsRevealed) {
    await db
      .update(userProgress)
      .set({ stepsRevealed: count })
      .where(eq(userProgress.id, progress.id));
  }
}

export async function markSolutionViewed(userId: string, problemId: number) {
  const db = await getDb();
  if (!db) return;
  
  const progress = await getOrCreateProgress(userId, problemId);
  await db
    .update(userProgress)
    .set({ viewedSolution: 1 })
    .where(eq(userProgress.id, progress.id));
}

export async function getUserProgressStats(userId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const progressRecords = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));
  
  if (progressRecords.length === 0) {
    return {
      totalProblemsViewed: 0,
      totalHintsRequested: 0,
      totalConditionsClicked: 0,
      totalStepsRevealed: 0,
      totalSolutionsViewed: 0,
    };
  }
  
  return {
    totalProblemsViewed: progressRecords.length,
    totalHintsRequested: progressRecords.reduce((sum, p) => sum + p.hintCount, 0),
    totalConditionsClicked: progressRecords.reduce((sum, p) => sum + p.conditionClickCount, 0),
    totalStepsRevealed: progressRecords.reduce((sum, p) => sum + p.stepsRevealed, 0),
    totalSolutionsViewed: progressRecords.reduce((sum, p) => sum + p.viewedSolution, 0),
  };
}
