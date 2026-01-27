import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Sparkles, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: problems, isLoading: problemsLoading } = trpc.problem.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 glow text-primary">
              Math AI Tutor
            </h1>
            <p className="text-xl text-muted-foreground">
              数学 AI 辅导助手
            </p>
          </div>
          
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                智能解题步骤提示
              </CardTitle>
              <CardDescription className="text-base">
                不直接给答案，而是引导你思考每一步的原因和下一步的方向
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm text-muted-foreground">
                    上传题目和答案图片，AI 自动识别解题步骤
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm text-muted-foreground">
                    点击任意步骤，获取"为什么"和"下一步"的提示
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm text-muted-foreground">
                    选中步骤中的文字，获取针对性的解释
                  </p>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full glow-box"
                onClick={() => window.location.href = getLoginUrl()}
              >
                登录开始学习
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary glow">Math AI Tutor</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Link href="/progress">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                学习进度
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                trpc.auth.logout.useMutation().mutate();
                window.location.reload();
              }}
            >
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">我的题目</h2>
          <p className="text-muted-foreground">
            点击题目查看解题步骤和 AI 提示
          </p>
        </div>

        {problemsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载题目中...</p>
          </div>
        ) : problems && problems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Link key={problem.id} href={`/problem/${problem.id}`}>
                <Card className="step-card h-full">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {problem.title || `题目 #${problem.id}`}
                    </CardTitle>
                    <CardDescription>
                      {problem.steps.length} 个步骤
                    </CardDescription>
                  </CardHeader>
                  {(problem.problemImageUrl || problem.solutionImageUrl) && (
                    <CardContent>
                      <div className="flex gap-2">
                        {problem.problemImageUrl && (
                          <img
                            src={problem.problemImageUrl}
                            alt="题目"
                            className="w-full h-32 object-cover rounded border border-border"
                          />
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">还没有题目</h3>
              <p className="text-muted-foreground mb-6">
                开始添加你的第一道题目，体验 AI 辅导功能
              </p>
              <Button asChild>
                <Link href="/upload">上传题目</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
