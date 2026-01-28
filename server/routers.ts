import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  problem: router({
    // Upload and create a new problem (Admin only)
    create: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: '只有管理员可以上传题目' });
        }
        return next({ ctx });
      })
      .input(z.object({
        title: z.string().optional(),
        problemImageUrl: z.string().optional(),
        problemImageKey: z.string().optional(),
        solutionImageUrl: z.string().optional(),
        solutionImageKey: z.string().optional(),
        steps: z.array(z.object({
          id: z.string(),
          text: z.string(),
        })),
        conditions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createProblem } = await import("./db");
        const problemId = await createProblem({
          userId: ctx.user.id,
          title: input.title,
          problemImageUrl: input.problemImageUrl,
          problemImageKey: input.problemImageKey,
          solutionImageUrl: input.solutionImageUrl,
          solutionImageKey: input.solutionImageKey,
          steps: JSON.stringify(input.steps),
          conditions: input.conditions ? JSON.stringify(input.conditions) : null,
        });
        return { id: problemId };
      }),

    // Get all problems list (public access)
    list: publicProcedure.query(async () => {
      const { getAllProblems } = await import("./db");
      const problems = await getAllProblems();
      return problems.map((p: any) => ({
        ...p,
        steps: JSON.parse(p.steps) as Array<{ id: string; text: string }>,
      }));
    }),

    // Get problem by ID (public access)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProblemById } = await import("./db");
        const problem = await getProblemById(input.id);
        if (!problem) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return {
          ...problem,
          steps: JSON.parse(problem.steps) as Array<{ id: string; text: string }>,
          conditions: problem.conditions ? JSON.parse(problem.conditions) as string[] : [],
        };
      }),

    // Extract steps from images using LLM vision
    extractSteps: protectedProcedure
      .input(z.object({
        problemImageUrl: z.string().optional(),
        solutionImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        type MessageContent = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
        type LLMMessage = { role: string; content: string | MessageContent[] };
        
        const messages: LLMMessage[] = [
          {
            role: "system",
            content: "你是一个数学解题步骤提取专家。请仔细分析图片中的数学题目和解答过程，提取出：1) 所有已知条件（如“∠ABC = ∠AED”、“AB = AE”）；2) 清晰的解题步骤。每个步骤应该是一个独立的推理或计算过程。",
          },
        ];

        const userContent: MessageContent[] = [
          { type: "text", text: "请从以下图片中提取：1) 所有已知条件（题目中明确给出的条件，如角度相等、边长相等、平行关系等）；2) 解题步骤。" },
        ];

        if (input.problemImageUrl) {
          userContent.push({
            type: "image_url",
            image_url: { url: input.problemImageUrl },
          });
        }

        if (input.solutionImageUrl) {
          userContent.push({
            type: "image_url",
            image_url: { url: input.solutionImageUrl },
          });
        }

        messages.push({ role: "user", content: userContent });

        const response = await invokeLLM({
          messages: messages as any,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "steps_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  conditions: {
                    type: "array",
                    description: "已知条件列表",
                    items: {
                      type: "string",
                    },
                  },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                      },
                      required: ["text"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["conditions", "steps"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM 未返回内容" });

        const parsed = JSON.parse(content);
        const steps = parsed.steps.map((s: any, idx: number) => ({
          id: `step-${idx + 1}`,
          text: s.text,
        }));
        const conditions = parsed.conditions || [];

        return { steps, conditions };
      }),

    // Get AI hint for a specific step (public access)
    hint: publicProcedure
      .input(z.object({
        problemImageUrl: z.string().optional(),
        solutionImageUrl: z.string().optional(),
        steps: z.array(z.object({
          id: z.string(),
          text: z.string(),
        })),
        conditions: z.array(z.string()).optional(),
        selectedStepId: z.string().optional(),
        selectedText: z.string().optional(),
        selectedCondition: z.string().optional(),
        mode: z.enum(["why", "next", "explainCondition"]),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        let systemPrompt = "";
        let userPrompt = "";

        if (input.mode === "explainCondition") {
          // 解释已知条件的作用
          if (!input.selectedCondition) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "未选中条件" });
          }

          systemPrompt = `你是一位数学辅导老师。学生选中了一个已知条件，需要你解释这个条件在解题中的作用。

重要约束：
1. 解释这个条件的含义
2. 说明它在解题中的具体作用（在哪些步骤中使用）
3. 控制在 2-5 句话以内
4. 使用简洁的中文
5. 数学公式使用 $...$ 格式包裹`;

          userPrompt = `已知条件：${input.selectedCondition}

解题步骤：
${input.steps.map((s, idx) => `${idx + 1}. ${s.text}`).join("\n")}

请解释这个条件的作用（2-5句话）：`;
        } else {
          // 原有的 why 和 next 模式
          const selectedStepIndex = input.steps.findIndex(s => s.id === input.selectedStepId);
          if (selectedStepIndex === -1) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "未找到选中的步骤" });
          }

          const selectedStep = input.steps[selectedStepIndex];
          const previousSteps = input.steps.slice(Math.max(0, selectedStepIndex - 2), selectedStepIndex);
          const nextStep = input.steps[selectedStepIndex + 1];

          if (input.mode === "why") {
          systemPrompt = `你是一位数学辅导老师。学生正在学习解题步骤，需要你解释为什么会得到当前这一步。

重要约束：
1. 只解释从上一两步到当前步骤的关键理由、公式或变形点
2. 控制在 1-4 句话以内
3. 不要把整道题完整讲完
4. 使用简洁的中文
5. 如果学生选中了特定文字，重点围绕选中部分解释`;

          userPrompt = `前面的步骤：\n${previousSteps.map(s => s.text).join("\n")}\n\n当前步骤：${selectedStep.text}`;
          if (input.selectedText) {
            userPrompt += `\n\n学生选中的文字："${input.selectedText}"`;
          }
          userPrompt += "\n\n请简洁解释为什么会得到这一步（1-4句话）：";
        } else {
          systemPrompt = `你是一位数学辅导老师。学生正在学习解题步骤，需要你给出下一步的思考方向。

重要约束：
1. 只给下一步的思考方向或提示（例如用哪个定理、构造哪个量、代入哪个式子）
2. 不直接给出最终答案或完整解法
3. 控制在 1-4 句话以内
4. 使用简洁的中文
5. 如果学生选中了特定文字，围绕选中部分给提示`;

          userPrompt = `当前步骤：${selectedStep.text}`;
          if (nextStep) {
            userPrompt += `\n\n（参考：下一步是 "${nextStep.text}"，但不要直接说出来）`;
          }
          if (input.selectedText) {
            userPrompt += `\n\n学生选中的文字："${input.selectedText}"`;
          }
          userPrompt += "\n\n请给出下一步的思考提示（1-4句话，不直接给答案）：";
          }
        }

        const messages: Array<any> = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ];

        const response = await invokeLLM({ messages });
        const hint = response.choices[0]?.message?.content || "";

        return { hint };
      }),

    // Record problem view
    recordView: protectedProcedure
      .input(z.object({ problemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { incrementViewCount } = await import("./db");
        await incrementViewCount(ctx.user.openId, input.problemId);
        return { success: true };
      }),

    // Record hint request
    recordHint: protectedProcedure
      .input(z.object({ problemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { incrementHintCount } = await import("./db");
        await incrementHintCount(ctx.user.openId, input.problemId);
        return { success: true };
      }),

    // Record condition click
    recordConditionClick: protectedProcedure
      .input(z.object({ problemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { incrementConditionClickCount } = await import("./db");
        await incrementConditionClickCount(ctx.user.openId, input.problemId);
        return { success: true };
      }),

    // Update steps revealed count
    recordStepsRevealed: protectedProcedure
      .input(z.object({ problemId: z.number(), count: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { updateStepsRevealed } = await import("./db");
        await updateStepsRevealed(ctx.user.openId, input.problemId, input.count);
        return { success: true };
      }),

    // Mark solution as viewed
    recordSolutionView: protectedProcedure
      .input(z.object({ problemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { markSolutionViewed } = await import("./db");
        await markSolutionViewed(ctx.user.openId, input.problemId);
        return { success: true };
      }),

    // Get user progress statistics
    getProgress: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserProgressStats } = await import("./db");
        return await getUserProgressStats(ctx.user.openId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
