import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, HelpCircle, Lightbulb, Loader2, Volume2, Eye, EyeOff, ChevronRight, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import SocraticMode from "@/components/SocraticMode";

export default function ProblemDetail() {
  const params = useParams<{ id: string }>();
  const problemId = parseInt(params.id || "0");

  const { data: problem, isLoading } = trpc.problem.getById.useQuery({ id: problemId });
  const hintMutation = trpc.problem.hint.useMutation();
  const recordViewMutation = trpc.problem.recordView.useMutation();
  const recordHintMutation = trpc.problem.recordHint.useMutation();
  const recordConditionClickMutation = trpc.problem.recordConditionClick.useMutation();
  const recordStepsRevealedMutation = trpc.problem.recordStepsRevealed.useMutation();
  const recordSolutionViewMutation = trpc.problem.recordSolutionView.useMutation();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [currentHint, setCurrentHint] = useState<string>("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [visibleStepsCount, setVisibleStepsCount] = useState(1); // 渐进式显示步骤
  const [showAllSteps, setShowAllSteps] = useState(false); // 是否显示所有步骤
  const [isSpeaking, setIsSpeaking] = useState(false); // 语音播放状态
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null); // 选中的条件
  const [isSocraticMode, setIsSocraticMode] = useState(false); // 苏格拉底引导模式
  const [guidingQuestions, setGuidingQuestions] = useState<any[]>([]); // 引导问题列表
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // 加载引导问题

  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedCondition(null); // 清除条件选中
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
        conditions: problem.conditions || undefined,
        selectedStepId,
        selectedText: selectedText || undefined,
        mode,
      });

      if (typeof result.hint === "string") {
        setCurrentHint(result.hint);
        // 记录提示请求
        recordHintMutation.mutate({ problemId });
      }
    } catch (error) {
      toast.error("获取提示失败，请重试");
      console.error(error);
    }
  };

  // 处理条件点击
  const handleConditionClick = async (condition: string) => {
    if (!problem) return;

    setSelectedCondition(condition);
    setSelectedStepId(null); // 清除步骤选中
    setSelectedText("");
    setCurrentHint(""); // 清除旧的提示
    setIsMobileDrawerOpen(true);

    try {
      const result = await hintMutation.mutateAsync({
        problemImageUrl: problem.problemImageUrl || undefined,
        solutionImageUrl: problem.solutionImageUrl || undefined,
        steps: problem.steps,
        conditions: problem.conditions || undefined,
        selectedCondition: condition,
        mode: "explainCondition",
      });

      if (typeof result.hint === "string") {
        setCurrentHint(result.hint);
        // 记录条件点击
        recordConditionClickMutation.mutate({ problemId });
      }
    } catch (error) {
      toast.error("获取条件解释失败，请重试");
      console.error(error);
    }
  };

  // 启动苏格拉底引导模式
  const generateQuestionsMutation = trpc.problem.generateGuidingQuestions.useMutation();

  const handleStartSocraticMode = async () => {
    if (!problem) return;

    setIsLoadingQuestions(true);
    try {
      const result = await generateQuestionsMutation.mutateAsync({
        problemImageUrl: problem.problemImageUrl || undefined,
        problemText: problem.problemText || undefined,
        solutionImageUrl: problem.solutionImageUrl || undefined,
        steps: problem.steps,
        conditions: problem.conditions || undefined,
      });

      setGuidingQuestions(result.questions);
      setIsSocraticMode(true);
      toast.success("引导问题已生成！");
    } catch (error) {
      toast.error("生成引导问题失败，请重试");
      console.error(error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleCompleteSocraticMode = () => {
    setIsSocraticMode(false);
    setGuidingQuestions([]);
    toast.success("恭喜完成引导模式！现在可以查看完整解题步骤。");
  };

  // 语音播放功能
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      // 停止当前播放
      window.speechSynthesis.cancel();
      
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      // 移除 LaTeX 公式符号，只读文本
      const cleanText = text.replace(/\$[^$]+\$/g, (match) => {
        return match.slice(1, -1); // 保留公式内容但去掉 $
      });

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9; // 语速
      utterance.pitch = 1; // 音调
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error('语音播放失败');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('浏览器不支持语音功能');
    }
  };

  // 记录页面查看
  useEffect(() => {
    if (problemId) {
      recordViewMutation.mutate({ problemId });
    }
  }, [problemId]);

  // 清理语音
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 显示下一步
  const handleShowNextStep = () => {
    if (problem && visibleStepsCount < problem.steps.length) {
      const newCount = visibleStepsCount + 1;
      setVisibleStepsCount(newCount);
      // 记录步骤揭示
      recordStepsRevealedMutation.mutate({ problemId, count: newCount });
    }
  };

  // 显示全部步骤
  const handleShowAllSteps = () => {
    if (problem) {
      setShowAllSteps(true);
      setVisibleStepsCount(problem.steps.length);
      // 记录步骤揭示
      recordStepsRevealedMutation.mutate({ problemId, count: problem.steps.length });
    }
  };

  // 隐藏步骤
  const handleHideSteps = () => {
    setShowAllSteps(false);
    setVisibleStepsCount(1);
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
              <CardContent className="space-y-4">
                {/* 题目文字 */}
                {problem.problemText && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">题目</p>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{renderMathText(problem.problemText)}</p>
                    </div>
                  </div>
                )}
                {/* 题目图片 */}
                {problem.problemImageUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{problem.problemText ? "题目图片（参考）" : "题目"}</p>
                    <img
                      src={problem.problemImageUrl}
                      alt="题目"
                      className="w-full rounded border border-border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 已知条件列表 */}
            {problem.conditions && problem.conditions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">已知条件</CardTitle>
                  <p className="text-sm text-muted-foreground">点击条件查看 AI 解释其在解题中的作用</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {problem.conditions.map((condition, index) => (
                      <button
                        key={index}
                        onClick={() => handleConditionClick(condition)}
                        className={`px-3 py-2 rounded-lg border transition-all ${
                          selectedCondition === condition
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-muted/50 border-border hover:border-primary/50 hover:bg-muted"
                        }`}
                      >
                        <span className="text-sm font-medium">{renderMathText(condition)}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 步骤列表 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">解题步骤</h2>
                <div className="flex gap-2">
                  {!isSocraticMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartSocraticMode}
                      disabled={isLoadingQuestions}
                    >
                      {isLoadingQuestions ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <GraduationCap className="w-4 h-4 mr-2" />
                      )}
                      引导模式
                    </Button>
                  )}
                  {!showAllSteps && visibleStepsCount < problem.steps.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowAllSteps}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      查看全部步骤
                    </Button>
                  )}
                  {showAllSteps && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHideSteps}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      隐藏步骤
                    </Button>
                  )}
                </div>
              </div>
              {isSocraticMode && guidingQuestions.length > 0 ? (
                <SocraticMode
                  questions={guidingQuestions}
                  onComplete={handleCompleteSocraticMode}
                  renderMathText={renderMathText}
                />
              ) : (
                <div className="space-y-3">
                  {problem.steps.slice(0, visibleStepsCount).map((step, index) => (
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
                  {!showAllSteps && visibleStepsCount < problem.steps.length && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleShowNextStep}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      显示下一步 ({visibleStepsCount + 1}/{problem.steps.length})
                    </Button>
                  )}
                </div>
              )}
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
                  {!selectedStepId && !selectedCondition ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      点击左侧的步骤卡片或已知条件开始获取 AI 提示
                    </p>
                  ) : selectedCondition ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">选中条件：</p>
                        <p className="text-sm text-primary bg-primary/10 p-3 rounded border border-primary/30">
                          {renderMathText(selectedCondition)}
                        </p>
                      </div>

                      {hintMutation.isPending && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}

                      {currentHint && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">AI 解释：</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSpeak(currentHint)}
                              className="h-8 px-2"
                            >
                              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                            </Button>
                          </div>
                          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMathText(currentHint)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : selectedStepId ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">选中步骤：</p>
                        <p className="text-sm text-muted-foreground">{selectedStep?.text}</p>
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
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">AI 提示：</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSpeak(currentHint)}
                              className="h-8 px-2"
                            >
                              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                            </Button>
                          </div>
                          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMathText(currentHint)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
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
            {!selectedStepId && !selectedCondition ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                点击步骤卡片或已知条件开始获取 AI 提示
              </p>
            ) : selectedCondition ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">选中条件：</p>
                  <p className="text-sm text-primary bg-primary/10 p-3 rounded border border-primary/30">
                    {renderMathText(selectedCondition)}
                  </p>
                </div>

                {hintMutation.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {currentHint && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">AI 解释：</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeak(currentHint)}
                        className="h-8 px-2"
                      >
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                      </Button>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMathText(currentHint)}</p>
                    </div>
                  </div>
                )}
              </>
            ) : selectedStep && (
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">AI 提示：</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeak(currentHint)}
                        className="h-8 px-2"
                      >
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                      </Button>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMathText(currentHint)}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 完整答案区域（页面最下方） */}
      {problem.solutionImageUrl && (
        <div className="container py-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">完整答案</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                以下是该题目的完整解答过程，仅供参考。建议先尝试自己解题，再查看答案。
              </p>
            </CardHeader>
            <CardContent>
              <img
                src={problem.solutionImageUrl}
                alt="完整答案"
                className="w-full rounded border border-border"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// 渲染包含 LaTeX 公式的文本
function renderMathText(text: string) {
  // 将 $...$ 转换为 LaTeX 渲染
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      const latex = part.slice(1, -1);
      try {
        return <InlineMath key={index} math={latex} />;
      } catch (e) {
        return <span key={index}>{part}</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
}
