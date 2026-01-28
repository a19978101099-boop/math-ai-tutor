import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Lightbulb, ChevronRight, Eye, EyeOff, Volume2, Loader2, GraduationCap } from "lucide-react";
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
  // Progress tracking mutations (if available)
  const recordProblemViewMutation = { mutate: () => {} };
  const recordHintRequestMutation = { mutate: () => {} };
  const recordStepsRevealedMutation = { mutate: () => {} };
  const recordConditionClickMutation = { mutate: () => {} };
  const generateQuestionsMutation = trpc.problem.generateGuidingQuestions.useMutation();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [currentHint, setCurrentHint] = useState<string>("");
  const [visibleStepsCount, setVisibleStepsCount] = useState(1);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSocraticMode, setIsSocraticMode] = useState(false);
  const [guidingQuestions, setGuidingQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

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

  // 记录题目查看
  useEffect(() => {
    if (problemId) {
      recordProblemViewMutation.mutate();
    }
  }, [problemId]);

  // 处理步骤点击
  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedCondition(null);
    setCurrentHint("");

    const step = problem?.steps.find((s) => s.id === stepId);
    if (!step) return;

    recordHintRequestMutation.mutate();

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

  // 处理条件点击
  const handleConditionClick = (condition: string) => {
    setSelectedCondition(condition);
    setSelectedStepId(null);
    setCurrentHint("");

    recordConditionClickMutation.mutate();

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

  // 文本选择处理
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      toast.info(`已选择文本：${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}`);
    }
  };

  // 显示下一步
  const handleShowNextStep = () => {
    if (problem && visibleStepsCount < problem.steps.length) {
      const newCount = visibleStepsCount + 1;
      setVisibleStepsCount(newCount);
      // 记录步骤揭示
      recordStepsRevealedMutation.mutate();
    }
  };

  // 显示全部步骤
  const handleShowAllSteps = () => {
    if (problem) {
      setShowAllSteps(true);
      setVisibleStepsCount(problem.steps.length);
      // 记录步骤揭示
      recordStepsRevealedMutation.mutate();
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
          {/* 左侧：题目信息 */}
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
                      <p className="text-base leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(problem.problemText) }} />
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
          </div>

          {/* 右侧：三个独立的框 */}
          <div className="space-y-6">
            {/* 1. 已知条件框 */}
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

            {/* 2. 解题步骤框 */}
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
                {/* 步骤提示 */}
                {selectedStepId && currentHint && (
                  <div className="mt-4 space-y-2">
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMathText(currentHint) }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. 苏格拉底模式框 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  苏格拉底模式
                </CardTitle>
                <p className="text-sm text-muted-foreground">通过引导问题逐步理解解题思路</p>
              </CardHeader>
              <CardContent>
                {!isSocraticMode ? (
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
