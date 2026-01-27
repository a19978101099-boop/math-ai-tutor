import { describe, expect, it } from "vitest";
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("problem.hint with explainCondition mode", () => {
  it("should explain the role of a selected condition", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "∠ACB = ∠CAD（内错角，AD // BC）" },
      { id: "step-2", text: "∠CAD = ∠ADE（内错角，AC // ED）" },
      { id: "step-3", text: "△ABC ≅ △AED（AAS 全等定理）" },
    ];

    const conditions = [
      "AC ∥ ED",
      "AD ∥ BC",
      "∠ABC = ∠AED",
      "AB = AE"
    ];

    const result = await caller.problem.hint({
      steps,
      conditions,
      selectedCondition: "AC ∥ ED",
      mode: "explainCondition",
    });

    // 验证返回的提示是字符串且不为空
    expect(result.hint).toBeTypeOf("string");
    expect(result.hint.length).toBeGreaterThan(0);
    
    // 验证提示内容简洁（控制在合理长度）
    expect(result.hint.length).toBeLessThan(500);
    
    console.log("AI 条件解释:", result.hint);
  });

  it("should handle missing selectedCondition", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const steps = [
      { id: "step-1", text: "示例步骤" },
    ];

    await expect(
      caller.problem.hint({
        steps,
        mode: "explainCondition",
      })
    ).rejects.toThrow("未选中条件");
  });
});
