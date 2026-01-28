import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Upload, Loader2, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";


export default function AdminUpload() {
  const { data: user } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();
  
  const [title, setTitle] = useState("");
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [problemImagePreview, setProblemImagePreview] = useState<string>("");
  const [solutionImagePreview, setSolutionImagePreview] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    steps: Array<{ id: string; text: string }>;
    conditions: string[];
    problemText: string;
  } | null>(null);

  const createMutation = trpc.problem.create.useMutation();
  const extractMutation = trpc.problem.extractSteps.useMutation();

  // Check if user is admin
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">访问被拒绝</CardTitle>
            <CardDescription>只有管理员可以访问此页面</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProblemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProblemImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProblemImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolutionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSolutionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSolutionImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractSteps = async () => {
    if (!problemImage && !solutionImage) {
      toast.error("请至少上传一张图片");
      return;
    }

    setIsExtracting(true);
    try {
      // Upload images to S3 first
      const formData = new FormData();
      if (problemImage) formData.append("problemImage", problemImage);
      if (solutionImage) formData.append("solutionImage", solutionImage);

      const uploadResponse = await fetch("/api/upload-images", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("图片上传失败");
      }

      const { problemImageUrl, solutionImageUrl } = await uploadResponse.json();

      // Extract steps using LLM
      const result = await extractMutation.mutateAsync({
        problemImageUrl,
        solutionImageUrl,
      });

      setExtractedData({
        steps: result.steps,
        conditions: result.conditions,
        problemText: result.problemText,
      });

      toast.success("步骤提取成功！请检查并确认");
    } catch (error) {
      console.error(error);
      toast.error("提取失败，请重试");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!extractedData) {
      toast.error("请先提取步骤");
      return;
    }

    if (!title.trim()) {
      toast.error("请输入题目标题");
      return;
    }

    setIsUploading(true);
    try {
      // Upload images to S3
      const formData = new FormData();
      if (problemImage) formData.append("problemImage", problemImage);
      if (solutionImage) formData.append("solutionImage", solutionImage);

      const uploadResponse = await fetch("/api/upload-images", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("图片上传失败");
      }

      const {
        problemImageUrl,
        problemImageKey,
        solutionImageUrl,
        solutionImageKey,
      } = await uploadResponse.json();

      // Create problem
      const result = await createMutation.mutateAsync({
        title,
        problemText: extractedData.problemText,
        problemImageUrl,
        problemImageKey,
        solutionImageUrl,
        solutionImageKey,
        steps: extractedData.steps,
        conditions: extractedData.conditions,
      });

      toast.success("题目创建成功！");
      setLocation(`/problem/${result.id}`);
    } catch (error) {
      console.error(error);
      toast.error("创建失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

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
            上传 DSE 数学真题
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title Input */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>题目信息</CardTitle>
              <CardDescription>请输入题目标题和描述</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">题目标题 *</Label>
                <Input
                  id="title"
                  placeholder="例如：题目7：坐标变换与斜率计算"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>上传图片</CardTitle>
              <CardDescription>上传题目和答案图片（至少一张）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Problem Image */}
              <div className="space-y-2">
                <Label htmlFor="problemImage">题目图片</Label>
                <Input
                  id="problemImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProblemImageChange}
                  className="bg-slate-800/50 border-slate-700"
                />
                {problemImagePreview && (
                  <div className="mt-4">
                    <img
                      src={problemImagePreview}
                      alt="题目预览"
                      className="max-w-full h-auto rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>

              {/* Solution Image */}
              <div className="space-y-2">
                <Label htmlFor="solutionImage">答案图片</Label>
                <Input
                  id="solutionImage"
                  type="file"
                  accept="image/*"
                  onChange={handleSolutionImageChange}
                  className="bg-slate-800/50 border-slate-700"
                />
                {solutionImagePreview && (
                  <div className="mt-4">
                    <img
                      src={solutionImagePreview}
                      alt="答案预览"
                      className="max-w-full h-auto rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleExtractSteps}
                disabled={isExtracting || (!problemImage && !solutionImage)}
                className="w-full"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI 正在提取步骤...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    提取解题步骤
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Extracted Data Preview */}
          {extractedData && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>提取结果预览</CardTitle>
                <CardDescription>请检查 AI 提取的步骤和已知条件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Conditions */}
                {extractedData.conditions.length > 0 && (
                  <div className="space-y-2">
                    <Label>已知条件 ({extractedData.conditions.length})</Label>
                    <div className="space-y-2">
                      {extractedData.conditions.map((condition, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                        >
                          <p className="text-sm">{condition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-2">
                  <Label>解题步骤 ({extractedData.steps.length})</Label>
                  <div className="space-y-2">
                    {extractedData.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          步骤 {index + 1}
                        </p>
                        <p className="text-sm">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      正在创建题目...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      确认并创建题目
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
