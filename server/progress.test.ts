import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { db } from "./db";
import { problems, userProgress } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("学习进度追踪功能测试", () => {
  const testProblemId = 7;
  const testUserId = "test-user-123";

  // 清理测试数据
  afterAll(async () => {
    const database = await db;
    if (database) {
      await database.delete(userProgress).where(eq(userProgress.userId, testUserId));
    }
  });

  it("应该能够记录题目查看", async () => {
    const caller = appRouter.createCaller({
      user: { openId: testUserId, name: "Test User", role: "user" },
    });

    const result = await caller.problem.recordView({ problemId: testProblemId });
    expect(result.success).toBe(true);
  });

  it("应该能够记录提示请求", async () => {
    const caller = appRouter.createCaller({
      user: { openId: testUserId, name: "Test User", role: "user" },
    });

    const result = await caller.problem.recordHint({ problemId: testProblemId });
    expect(result.success).toBe(true);
  });

  it("应该能够记录条件点击", async () => {
    const caller = appRouter.createCaller({
      user: { openId: testUserId, name: "Test User", role: "user" },
    });

    const result = await caller.problem.recordConditionClick({ problemId: testProblemId });
    expect(result.success).toBe(true);
  });

  it("应该能够记录步骤揭示", async () => {
    const caller = appRouter.createCaller({
      user: { openId: testUserId, name: "Test User", role: "user" },
    });

    const result = await caller.problem.recordStepsRevealed({ problemId: testProblemId, count: 3 });
    expect(result.success).toBe(true);
  });

  it("应该能够获取学习统计数据", async () => {
    const caller = appRouter.createCaller({
      user: { openId: testUserId, name: "Test User", role: "user" },
    });

    // 先记录一些数据
    await caller.problem.recordView({ problemId: testProblemId });
    await caller.problem.recordHint({ problemId: testProblemId });
    await caller.problem.recordConditionClick({ problemId: testProblemId });

    const stats = await caller.problem.getProgress();

    expect(stats).toBeDefined();
    if (stats) {
      expect(stats.totalProblemsViewed).toBeGreaterThan(0);
      expect(stats.totalHintsRequested).toBeGreaterThan(0);
      expect(stats.totalConditionsClicked).toBeGreaterThan(0);
    }
  });


});
