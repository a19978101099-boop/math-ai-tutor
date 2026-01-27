import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("problem.hint", () => {
  it("should return a hint for 'why' mode", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "设 S(12, -5) 逆时针旋转 90° 得到 S'(5, 12)" },
      { id: "step-2", text: "T(-3, -7) 关于 x 轴反射得到 T'(-3, 7)" },
      { id: "step-3", text: "斜率 = (12 - 7) / (5 - (-3)) = 5/8" },
    ];

    const result = await caller.problem.hint({
      steps,
      selectedStepId: "step-3",
      mode: "why",
    });

    expect(result).toHaveProperty("hint");
    expect(typeof result.hint).toBe("string");
    expect(result.hint.length).toBeGreaterThan(0);
    // AI 应该解释斜率公式的应用
    console.log("Why mode hint:", result.hint);
  });

  it("should return a hint for 'next' mode", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "设 S(12, -5) 逆时针旋转 90° 得到 S'(5, 12)" },
      { id: "step-2", text: "T(-3, -7) 关于 x 轴反射得到 T'(-3, 7)" },
    ];

    const result = await caller.problem.hint({
      steps,
      selectedStepId: "step-2",
      mode: "next",
    });

    expect(result).toHaveProperty("hint");
    expect(typeof result.hint).toBe("string");
    expect(result.hint.length).toBeGreaterThan(0);
    // AI 应该提示下一步计算斜率
    console.log("Next mode hint:", result.hint);
  });

  it("should handle selectedText parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "使用斜率公式 m = (y₂ - y₁) / (x₂ - x₁)" },
    ];

    const result = await caller.problem.hint({
      steps,
      selectedStepId: "step-1",
      selectedText: "斜率公式",
      mode: "why",
    });

    expect(result).toHaveProperty("hint");
    expect(typeof result.hint).toBe("string");
    // AI 应该围绕"斜率公式"这个选中文本进行解释
    console.log("Hint with selectedText:", result.hint);
  });

  it("should throw error for invalid step ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "第一步" },
    ];

    await expect(
      caller.problem.hint({
        steps,
        selectedStepId: "invalid-step",
        mode: "why",
      })
    ).rejects.toThrow("未找到选中的步骤");
  });
});
