import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Lightbulb, MousePointerClick, Eye, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Progress() {
  const { data: stats, isLoading } = trpc.problem.getProgress.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-primary">加载中...</div>
      </div>
    );
  }

  const statsData = [
    {
      icon: BookOpen,
      label: "已查看题目",
      value: stats?.totalProblemsViewed || 0,
      description: "您已经浏览过的不同题目数量",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: Lightbulb,
      label: "获取提示次数",
      value: stats?.totalHintsRequested || 0,
      description: "您请求 AI 提示的总次数",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      icon: MousePointerClick,
      label: "点击条件次数",
      value: stats?.totalConditionsClicked || 0,
      description: "您点击已知条件获取解释的次数",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      icon: Eye,
      label: "揭示步骤总数",
      value: stats?.totalStepsRevealed || 0,
      description: "您主动揭示的解题步骤总数",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: CheckCircle,
      label: "查看完整答案",
      value: stats?.totalSolutionsViewed || 0,
      description: "您查看过完整答案的题目数量",
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            学习进度报告
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-primary/20 to-blue-500/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">您的学习统计</CardTitle>
              <CardDescription className="text-slate-300">
                跟踪您的学习进度，了解您的学习习惯和成长轨迹
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-slate-900/50 border-slate-800 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <CardTitle className="text-lg">{stat.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Insights Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>学习建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && stats.totalProblemsViewed === 0 && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    🎯 开始您的学习之旅！浏览题目列表，选择一道题目开始练习。
                  </p>
                </div>
              )}
              
              {stats && stats.totalProblemsViewed > 0 && stats.totalHintsRequested === 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    💡 遇到困难时，不要犹豫！点击步骤卡片获取 AI 提示，帮助您理解解题思路。
                  </p>
                </div>
              )}
              
              {stats && stats.totalConditionsClicked === 0 && stats.totalProblemsViewed > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    📚 尝试点击已知条件，了解它们在解题中的作用，加深对题目的理解。
                  </p>
                </div>
              )}
              
              {stats && stats.totalHintsRequested > 10 && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-300">
                    🌟 您已经获取了 {stats.totalHintsRequested} 次提示！继续保持这种主动学习的态度。
                  </p>
                </div>
              )}
              
              {stats && stats.totalProblemsViewed >= 5 && (
                <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                  <p className="text-sm text-pink-300">
                    🎉 太棒了！您已经浏览了 {stats.totalProblemsViewed} 道题目，学习进度很好！
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <BookOpen className="w-5 h-5" />
                继续学习
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
