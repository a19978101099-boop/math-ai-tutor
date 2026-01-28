import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface GuidingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SocraticModeProps {
  questions: GuidingQuestion[];
  onComplete: () => void;
  renderMathText: (text: string) => React.ReactNode;
}

export default function SocraticMode({ questions, onComplete, renderMathText }: SocraticModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleOptionClick = (index: number) => {
    if (showFeedback) return; // 已经显示反馈，不能再选择

    setSelectedOption(index);
    setShowFeedback(true);

    const isCorrect = index === currentQuestion.correctIndex;
    setAnsweredCorrectly([...answeredCorrectly, isCorrect]);

    if (isCorrect) {
      toast.success("回答正确！");
    } else {
      toast.error("回答错误，请查看正确答案和解释");
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const correctCount = answeredCorrectly.filter(Boolean).length;
      toast.success(`完成！你答对了 ${correctCount}/${questions.length} 道题`);
      onComplete();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>苏格拉底引导进度</span>
          <span>{currentQuestionIndex + 1} / {questions.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 当前问题 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            问题 {currentQuestionIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 问题文字 */}
          <div className="text-base leading-relaxed">
            {renderMathText(currentQuestion.question)}
          </div>

          {/* 选项列表 */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">选择一个选项：</p>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    showCorrect
                      ? "bg-green-500/20 border-green-500 text-green-100"
                      : showWrong
                      ? "bg-red-500/20 border-red-500 text-red-100"
                      : isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-muted/50 border-border hover:border-primary/50 hover:bg-muted"
                  } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5">
                      {showCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : showWrong ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <span className="text-sm font-medium">{String.fromCharCode(65 + index)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {renderMathText(option)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 反馈和解释 */}
          {showFeedback && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm font-medium mb-2">
                {selectedOption === currentQuestion.correctIndex ? "✅ 正确！" : "❌ 错误"}
              </p>
              <p className="text-sm leading-relaxed">
                {renderMathText(currentQuestion.explanation)}
              </p>
            </div>
          )}

          {/* 下一题按钮 */}
          {showFeedback && (
            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
            >
              {isLastQuestion ? "完成苏格拉底引导" : "下一题"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
