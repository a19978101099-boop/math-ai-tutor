import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, HelpCircle, Lightbulb, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ProblemDetail() {
  const params = useParams<{ id: string }>();
  const problemId = parseInt(params.id || "0");

  const { data: problem, isLoading } = trpc.problem.getById.useQuery({ id: problemId });
  const hintMutation = trpc.problem.hint.useMutation();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [currentHint, setCurrentHint] = useState<string>("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedText("");
    setCurrentHint("");
    setIsMobileDrawerOpen(true);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      setSelectedText(text);
    }
  };

  const handleGetHint = async (mode: "why" | "next") => {
    if (!problem || !selectedStepId) return;

    try {
      const result = await hintMutation.mutateAsync({
        problemImageUrl: problem.problemImageUrl || undefined,
        solutionImageUrl: problem.solutionImageUrl || undefined,
        steps: problem.steps,
        selectedStepId,
        selectedText: selectedText || undefined,
        mode,
      });

      if (typeof result.hint === "string") {
        setCurrentHint(result.hint);
      }
    } catch (error) {
      toast.error("获取提示失败，请重试");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载题目中...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-4">题目不存在</p>
            <Button asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedStep = problem.steps.find((s) => s.id === selectedStepId);

  return (
    <div className="min-h-screen gradient-bg">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-0 z-10">
        <div className="container py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Link>
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：题目信息和步骤列表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 题目信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{problem.title || `题目 #${problem.id}`}</CardTitle>
              </CardHeader>
              {(problem.problemImageUrl || problem.solutionImageUrl) && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {problem.problemImageUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">题目</p>
                        <img
                          src={problem.problemImageUrl}
                          alt="题目"
                          className="w-full rounded border border-border"
                        />
                      </div>
                    )}
                    {problem.solutionImageUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">答案</p>
                        <img
                          src={problem.solutionImageUrl}
                          alt="答案"
                          className="w-full rounded border border-border"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 步骤列表 */}
            <div>
              <h2 className="text-xl font-bold mb-4">解题步骤</h2>
              <div className="space-y-3">
                {problem.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`step-card ${selectedStepId === step.id ? "step-card-selected" : ""}`}
                    onClick={() => handleStepClick(step.id)}
                    onMouseUp={handleTextSelection}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-selection-highlight select-text">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：AI 提示面板（桌面端） */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    AI 提示
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedStep ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      点击左侧的步骤卡片开始获取 AI 提示
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">当前步骤：</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                          {selectedStep.text}
                        </p>
                      </div>

                      {selectedText && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">选中文字：</p>
                          <p className="text-sm text-primary bg-primary/10 p-3 rounded border border-primary/30">
                            {selectedText}
                          </p>
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleGetHint("why")}
                          disabled={hintMutation.isPending}
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          为什么会得到这一步？
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleGetHint("next")}
                          disabled={hintMutation.isPending}
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          下一步怎么思考？
                        </Button>
                      </div>

                      {hintMutation.isPending && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}

                      {currentHint && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">AI 提示：</p>
                          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <p className="text-sm leading-relaxed">{currentHint}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端抽屉 */}
      <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              AI 提示
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedStep && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">当前步骤：</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                    {selectedStep.text}
                  </p>
                </div>

                {selectedText && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">选中文字：</p>
                    <p className="text-sm text-primary bg-primary/10 p-3 rounded border border-primary/30">
                      {selectedText}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleGetHint("why")}
                    disabled={hintMutation.isPending}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    为什么会得到这一步？
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleGetHint("next")}
                    disabled={hintMutation.isPending}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    下一步怎么思考？
                  </Button>
                </div>

                {hintMutation.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {currentHint && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">AI 提示：</p>
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">{currentHint}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
