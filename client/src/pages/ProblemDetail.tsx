import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Lightbulb, ChevronRight, Eye, EyeOff, Volume2, Loader2, GraduationCap, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import katex from "katex";
import "katex/dist/katex.min.css";
import SocraticMode from "@/components/SocraticMode";

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const problemId = parseInt(id || "0");

  const { data: problem, isLoading } = trpc.problem.getById.useQuery({ id: problemId });
  const hintMutation = trpc.problem.hint.useMutation();
  const generateQuestionsMutation = trpc.problem.generateGuidingQuestions.useMutation();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [currentHint, setCurrentHint] = useState<string>("");
  const [hintMode, setHintMode] = useState<"why" | "next" | null>(null);
  const [visibleStepsCount, setVisibleStepsCount] = useState(1);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSocraticMode, setIsSocraticMode] = useState(false);
  const [guidingQuestions, setGuidingQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showSolutionImage, setShowSolutionImage] = useState(false);

  // 渲染数学公式
  const renderMathText = (text: string) => {
    try {
      return text.replace(/\$([^$]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });
    } catch {
      return text;
    }
  };

  // 处理步骤点击 - 显示两个选项
  const handleStepClick = (stepId: string) => {
    if (selectedStepId === stepId) {
      // 如果点击的是同一个步骤，取消选择
      setSelectedStepId(null);
      setHintMode(null);
      setCurrentHint("");
    } else {
      setSelectedStepId(stepId);
      setSelectedCondition(null);
      setCurrentHint("");
      setHintMode(null);
    }
  };

  // 获取步骤提示 - "怎么得到这一步"
  const handleGetWhyHint = (stepId: string) => {
    setHintMode("why");
    setCurrentHint("");

    hintMutation.mutate(
      {
        steps: problem?.steps.map((s) => ({ id: s.id, text: s.text })) || [],
        selectedStepId: stepId,
        mode: "why" as const,
        conditions: problem?.conditions || [],
      },
      {
        onSuccess: (data) => {
          setCurrentHint(typeof data.hint === 'string' ? data.hint : '');
        },
        onError: () => {
          toast.error("获取提示失败，请重试");
        },
      }
    );
  };

  // 获取步骤提示 - "下一步怎么思考"
  const handleGetNextHint = (stepId: string) => {
    setHintMode("next");
    setCurrentHint("");

    hintMutation.mutate(
      {
        steps: problem?.steps.map((s) => ({ id: s.id, text: s.text })) || [],
        selectedStepId: stepId,
        mode: "next" as const,
        conditions: problem?.conditions || [],
      },
      {
        onSuccess: (data) => {
          setCurrentHint(typeof data.hint === 'string' ? data.hint : '');
        },
        onError: () => {
          toast.error("获取提示失败，请重试");
        },
      }
    );
  };

  // 处理条件点击
  const handleConditionClick = (condition: string) => {
    setSelectedCondition(condition);
    setSelectedStepId(null);
    setCurrentHint("");
    setHintMode(null);

    hintMutation.mutate(
      {
        steps: problem?.steps.map((s) => ({ id: s.id, text: s.text })) || [],
        selectedCondition: condition,
        mode: "explainCondition" as const,
        conditions: problem?.conditions || [],
      },
      {
        onSuccess: (data) => {
          setCurrentHint(typeof data.hint === 'string' ? data.hint : '');
        },
        onError: () => {
          toast.error("获取条件解释失败，请重试");
        },
      }
    );
  };

  // 启动苏格拉底模式
  const handleStartSocraticMode = async () => {
    if (!problem) return;

    setIsLoadingQuestions(true);
    try {
      const result = await generateQuestionsMutation.mutateAsync({
        problemText: problem.problemText || undefined,
        steps: problem.steps.map((s) => ({ id: s.id, text: s.text })),
        conditions: problem.conditions || [],
      });

      setGuidingQuestions(result.questions);
      setIsSocraticMode(true);
      toast.success("苏格拉底引导问题已生成！");
    } catch (error) {
      toast.error("生成苏格拉底引导问题失败，请重试");
      console.error(error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleCompleteSocraticMode = () => {
    setIsSocraticMode(false);
    setGuidingQuestions([]);
    toast.success("恭喜完成苏格拉底引导！现在可以查看完整解题步骤。");
  };

  // 语音播放功能
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("您的浏览器不支持语音播放");
    }
  };

  // 显示下一步
  const handleShowNextStep = () => {
    if (problem && visibleStepsCount < problem.steps.length) {
      setVisibleStepsCount(visibleStepsCount + 1);
    }
  };

  // 显示全部步骤
  const handleShowAllSteps = () => {
    if (problem) {
      setShowAllSteps(true);
      setVisibleStepsCount(problem.steps.length);
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：题目、已知条件、解题步骤、答案 */}
          <div className="space-y-6">
            {/* 题目信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{problem.title || `题目 #${problem.id}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 中文题目文字 */}
                {problem.problemText && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-semibold">中文题目</p>
                    <div className="prose prose-invert max-w-none bg-muted/30 p-4 rounded-lg">
                      <p className="text-base leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(problem.problemText) }} />
                    </div>
                  </div>
                )}
                {/* 英文题目文字 */}
                {problem.problemTextEn && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-semibold">English Question</p>
                    <div className="prose prose-invert max-w-none bg-muted/30 p-4 rounded-lg">
                      <p className="text-base leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(problem.problemTextEn) }} />
                    </div>
                  </div>
                )}
                {/* 题目图片 */}
                {problem.problemImageUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-semibold">题目图片（参考）</p>
                    <img
                      src={problem.problemImageUrl}
                      alt="题目"
                      className="w-full rounded border border-border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 已知条件 */}
            {problem.conditions && problem.conditions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">已知条件</CardTitle>
                  <p className="text-sm text-muted-foreground">点击条件查看 AI 解释</p>
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
                        <span className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: renderMathText(condition) }} />
                      </button>
                    ))}
                  </div>
                  {/* 条件解释 */}
                  {selectedCondition && currentHint && (
                    <div className="mt-4 space-y-2">
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
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(currentHint) }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 解题步骤 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">解题步骤</CardTitle>
                  <div className="flex gap-2">
                    {!showAllSteps && visibleStepsCount < problem.steps.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShowAllSteps}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        全部
                      </Button>
                    )}
                    {showAllSteps && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHideSteps}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        隐藏
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {problem.steps.slice(0, visibleStepsCount).map((step, index) => (
                    <div key={step.id} className="space-y-2">
                      <div
                        className={`step-card cursor-pointer ${selectedStepId === step.id ? "step-card-selected" : ""}`}
                        onClick={() => handleStepClick(step.id)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {index + 1}
                          </div>
                          <p className="flex-1 text-selection-highlight select-text" dangerouslySetInnerHTML={{ __html: renderMathText(step.text) }} />
                        </div>
                      </div>
                      
                      {/* 步骤选项：怎么得到这一步 / 下一步怎么思考 */}
                      {selectedStepId === step.id && (
                        <div className="ml-11 space-y-3">
                          <div className="flex gap-2">
                            <Button
                              variant={hintMode === "why" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleGetWhyHint(step.id)}
                              disabled={hintMutation.isPending}
                            >
                              <HelpCircle className="w-4 h-4 mr-2" />
                              怎么得到这一步？
                            </Button>
                            <Button
                              variant={hintMode === "next" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleGetNextHint(step.id)}
                              disabled={hintMutation.isPending}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              下一步怎么思考？
                            </Button>
                          </div>
                          
                          {/* 提示内容 */}
                          {hintMutation.isPending && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">AI 思考中...</span>
                            </div>
                          )}
                          
                          {currentHint && hintMode && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {hintMode === "why" ? "这一步的由来：" : "下一步思路："}
                                </p>
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
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(currentHint) }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
              </CardContent>
            </Card>

            {/* 答案图片 */}
            {problem.solutionImageUrl && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">完整答案</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSolutionImage(!showSolutionImage)}
                    >
                      {showSolutionImage ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          隐藏答案
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          查看答案
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">建议先尝试自己解题，再查看答案。</p>
                </CardHeader>
                {showSolutionImage && (
                  <CardContent>
                    <img
                      src={problem.solutionImageUrl}
                      alt="完整答案"
                      className="w-full rounded border border-border"
                    />
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* 右侧：苏格拉底模式 */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  苏格拉底模式
                </CardTitle>
                <p className="text-sm text-muted-foreground">通过引导问题逐步理解解题思路</p>
              </CardHeader>
              <CardContent>
                {!isSocraticMode ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      苏格拉底模式会通过一系列引导问题，帮助你逐步理解解题思路，而不是直接告诉你答案。
                    </p>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleStartSocraticMode}
                      disabled={isLoadingQuestions}
                    >
                      {isLoadingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4 mr-2" />
                          开始苏格拉底引导
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <SocraticMode
                    questions={guidingQuestions}
                    onComplete={handleCompleteSocraticMode}
                    renderMathText={renderMathText}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
