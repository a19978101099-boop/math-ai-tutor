# Math AI Tutor - 项目迁移指南

## 概述

本文档提供了将 Math AI Tutor 项目迁移到新 Manus 账号的详细技术指南。项目已连接到 GitHub，代码和配置可以直接从仓库克隆。

---

## 项目信息

**项目名称**：Math AI Tutor（数学 AI 辅导助手）

**GitHub 仓库**：https://github.com/a19978101099-boop/math-ai-tutor.git

**项目类型**：Web 应用（基于 tRPC + Database + User Auth 模板）

**主要功能**：
- DSE 数学题目展示（中英文题目 + LaTeX 公式渲染）
- AI 逐步解题提示系统
- 苏格拉底式教学模式
- 学习进度追踪
- 管理员题目上传和 AI 识别

---

## 快速迁移（推荐）

### 第一步：初始化项目

在新 Manus 账号中开启对话，复制并发送 `NEW_ACCOUNT_PROMPT.md` 中的提示词。Manus AI 将自动：

1. 从 GitHub 克隆项目代码
2. 安装所有依赖（`pnpm install`）
3. 创建数据库表（`pnpm db:push`）
4. 启动开发服务器

预计耗时：2-3 分钟

### 第二步：导入题目数据

初始化完成后，发送消息：
```
请帮我导入题目数据
```

然后上传 `problems_data.json` 文件。该文件包含 2 道预置题目的完整数据（包含正确的 LaTeX 格式）。

### 第三步：设置管理员权限

发送消息：
```
请将我的账号设置为管理员
```

Manus AI 将在数据库中将您的用户角色设置为 `admin`，允许您上传新题目。

### 第四步：测试功能

访问以下页面验证迁移成功：
- 首页：`/`
- 题目详情页：`/problem/30001`
- 学习进度页：`/progress`
- 管理员上传页：`/admin/upload`

---

## 技术架构

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 19 | UI 组件库 |
| 样式 | Tailwind CSS | 4 | 原子化 CSS |
| 路由 | Wouter | - | 轻量级路由 |
| 后端框架 | Express | 4 | Node.js 服务器 |
| API 层 | tRPC | 11 | 类型安全的 API |
| 数据库 | MySQL | - | Manus 平台提供 |
| ORM | Drizzle | - | 类型安全的 ORM |
| AI | Manus LLM API | - | 自动注入 |
| 数学公式 | KaTeX | - | LaTeX 渲染 |
| 语音合成 | Web Speech API | - | 浏览器原生 |

### 数据库结构

#### 1. users 表（由模板提供）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| openId | VARCHAR | Manus OAuth ID |
| name | VARCHAR | 用户名 |
| avatar | VARCHAR | 头像 URL |
| role | ENUM('admin', 'user') | 用户角色 |
| createdAt | TIMESTAMP | 创建时间 |

#### 2. problems 表（题目表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键（自增，起始值 30001） |
| title | VARCHAR | 题目标题 |
| problemText | TEXT | 中文题目文字（LaTeX 格式） |
| problemTextEn | TEXT | 英文题目文字（LaTeX 格式） |
| problemImageUrl | VARCHAR | 题目图片 URL |
| problemImageKey | VARCHAR | 题目图片 S3 key |
| solutionImageUrl | VARCHAR | 答案图片 URL |
| solutionImageKey | VARCHAR | 答案图片 S3 key |
| steps | JSON | 解题步骤数组 |
| conditions | JSON | 已知条件数组 |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### 3. progress 表（学习进度表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 用户 ID（外键） |
| problemId | INT | 题目 ID（外键） |
| completed | BOOLEAN | 是否完成 |
| hintsUsed | INT | 使用提示次数 |
| lastViewedAt | TIMESTAMP | 最后查看时间 |

### 环境变量

项目使用 Manus 平台的内置服务，所有环境变量由平台自动注入，无需手动配置：

| 环境变量 | 说明 | 来源 |
|---------|------|------|
| DATABASE_URL | MySQL 连接字符串 | Manus 平台 |
| JWT_SECRET | Session cookie 签名密钥 | Manus 平台 |
| VITE_APP_ID | Manus OAuth 应用 ID | Manus 平台 |
| OAUTH_SERVER_URL | Manus OAuth 后端 URL | Manus 平台 |
| VITE_OAUTH_PORTAL_URL | Manus 登录门户 URL | Manus 平台 |
| OWNER_OPEN_ID | 项目所有者 Open ID | Manus 平台 |
| OWNER_NAME | 项目所有者名称 | Manus 平台 |
| BUILT_IN_FORGE_API_URL | Manus LLM API URL | Manus 平台 |
| BUILT_IN_FORGE_API_KEY | Manus LLM API 密钥 | Manus 平台 |
| VITE_FRONTEND_FORGE_API_KEY | 前端 LLM API 密钥 | Manus 平台 |
| VITE_FRONTEND_FORGE_API_URL | 前端 LLM API URL | Manus 平台 |

---

## 手动迁移（高级）

如果自动迁移失败，可以按照以下步骤手动操作。

### 1. 克隆项目

```bash
git clone https://github.com/a19978101099-boop/math-ai-tutor.git
cd math-ai-tutor
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 创建数据库表

```bash
pnpm db:push
```

这将根据 `drizzle/schema.ts` 创建所有表。

### 4. 启动开发服务器

```bash
pnpm dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 5. 导入题目数据

使用以下 SQL 语句导入题目数据（或使用 Manus 管理界面的数据库工具）：

```sql
INSERT INTO problems (id, title, problemText, problemTextEn, problemImageUrl, solutionImageUrl, steps, conditions)
VALUES
  (30001, '题目7：坐标变换与斜率计算', '...', '...', '...', '...', '[...]', '[...]'),
  (30002, '题目8：三角形全等证明与角度计算', '...', '...', '...', '...', '[...]', '[...]');
```

完整的 SQL 语句请参考 `problems_data.json`。

### 6. 设置管理员权限

在数据库中执行：

```sql
UPDATE users SET role = 'admin' WHERE openId = '<your_open_id>';
```

将 `<your_open_id>` 替换为您的 Manus Open ID（可以在用户表中查询）。

---

## 故障排除

### 问题 1：图片无法显示

**症状**：题目详情页显示"图片加载失败"

**原因**：图片 URL 指向原账号的 S3 存储，新账号无法访问

**解决方案**：

**方案 A**：使用管理员上传功能重新上传题目
1. 访问 `/admin/upload`
2. 上传题目和答案图片
3. AI 会自动识别并提取中英文题目、步骤和条件
4. 检查识别结果，手动修正 LaTeX 格式（如有需要）
5. 提交创建新题目

**方案 B**：手动迁移图片到新账号 S3
1. 下载原图片文件
2. 使用 `storagePut` 上传到新账号的 S3
3. 更新数据库中的 `problemImageUrl` 和 `solutionImageUrl`

### 问题 2：数据库连接失败

**症状**：开发服务器启动失败，日志显示"Cannot connect to database"

**原因**：环境变量 `DATABASE_URL` 未正确注入

**解决方案**：

1. 检查 `.env` 文件是否存在（Manus 平台会自动创建）
2. 重启开发服务器：
   ```bash
   pnpm dev
   ```
3. 如果问题持续，检查 Manus 管理界面的"数据库"面板，确认数据库已创建
4. 尝试手动运行 `pnpm db:push` 重新创建表

### 问题 3：LLM API 调用失败

**症状**：AI 提示功能无法使用，控制台显示"401 Unauthorized"

**原因**：API 密钥未正确配置

**解决方案**：

1. 检查环境变量 `BUILT_IN_FORGE_API_KEY` 是否存在：
   ```bash
   echo $BUILT_IN_FORGE_API_KEY
   ```
2. 重启开发服务器
3. 如果问题持续，联系 Manus 支持

### 问题 4：数学公式无法渲染

**症状**：题目详情页显示原始 LaTeX 代码（如 `$\angle ABC$`），而不是渲染后的符号

**原因**：题目数据中的数学符号未使用正确的 LaTeX 格式

**解决方案**：

1. 检查数据库中的 `problemText` 和 `problemTextEn` 字段
2. 确保所有数学符号都用 `$` 包裹，例如：
   - 角度：`$\angle ABC = 39°$`
   - 三角形：`$\triangle ABC$`
   - 平行：`$AC \parallel ED$`
   - 全等：`$\triangle ABC \cong \triangle AED$`
3. 使用管理员上传功能重新创建题目，AI 会自动转换为正确的 LaTeX 格式

### 问题 5：管理员上传功能无法使用

**症状**：访问 `/admin/upload` 显示"只有管理员可以上传题目"

**原因**：当前用户角色不是 `admin`

**解决方案**：

1. 在数据库中执行：
   ```sql
   UPDATE users SET role = 'admin' WHERE openId = '<your_open_id>';
   ```
2. 刷新页面
3. 如果不知道自己的 `openId`，可以查询：
   ```sql
   SELECT * FROM users WHERE name = '<your_name>';
   ```

---

## 数据迁移详解

### 题目数据格式

`problems_data.json` 包含 2 道预置题目的完整数据。每道题目的结构如下：

```json
{
  "id": 30001,
  "title": "题目7：坐标变换与斜率计算",
  "problemText": "7. 点 $S$ 和 $T$ 的坐标分别是 $(12, -5)$ 和 $(-3, -7)$...",
  "problemTextEn": "7. The coordinates of the points $S$ and $T$ are...",
  "problemImageUrl": "/uploads/xxx.png",
  "solutionImageUrl": "/uploads/yyy.png",
  "steps": [
    {
      "id": "step-1",
      "text": "S' 的坐标是 (5, 12)..."
    }
  ],
  "conditions": [
    "S(12, -5)",
    "T(-3, -7)"
  ]
}
```

### 导入题目数据的方法

**方法 A**：通过 Manus AI（推荐）

发送消息：
```
请帮我导入题目数据
```
然后上传 `problems_data.json` 文件。Manus AI 会自动解析并插入数据库。

**方法 B**：使用 tRPC API

创建一个临时脚本：

```typescript
import { trpc } from './client/src/lib/trpc';

const data = require('./problems_data.json');

for (const problem of data) {
  await trpc.problem.create.mutate({
    title: problem.title,
    problemText: problem.problemText,
    problemTextEn: problem.problemTextEn,
    problemImageUrl: problem.problemImageUrl,
    solutionImageUrl: problem.solutionImageUrl,
    steps: problem.steps,
    conditions: problem.conditions,
  });
}
```

**方法 C**：直接操作数据库

使用 Manus 管理界面的"数据库"面板，执行 INSERT 语句。

---

## LaTeX 格式指南

项目使用 KaTeX 渲染数学公式。所有数学符号必须用 `$` 包裹。

### 常用符号

| 符号 | LaTeX 代码 | 示例 |
|------|-----------|------|
| 角度 | `\angle` | `$\angle ABC$` |
| 三角形 | `\triangle` | `$\triangle ABC$` |
| 平行 | `\parallel` | `$AB \parallel CD$` |
| 垂直 | `\perp` | `$AB \perp CD$` |
| 全等 | `\cong` | `$\triangle ABC \cong \triangle DEF$` |
| 相似 | `\sim` | `$\triangle ABC \sim \triangle DEF$` |
| 等于 | `=` | `$AB = CD$` |
| 不等于 | `\neq` | `$AB \neq CD$` |
| 小于等于 | `\leq` | `$x \leq 5$` |
| 大于等于 | `\geq` | `$x \geq 5$` |
| 度数 | `°` | `$\angle ABC = 90°$` |
| 分数 | `\frac{a}{b}` | `$\frac{1}{2}$` |
| 根号 | `\sqrt{x}` | `$\sqrt{2}$` |
| 上标 | `^` | `$x^2$` |
| 下标 | `_` | `$x_1$` |

### 示例

**错误**：
```
在图1中，A 是四边形 BCDE 内的一点，满足 AC // ED 和 AD // BC。
已知 ∠ABC = ∠AED 和 AB = AE。
```

**正确**：
```
在图1中，$A$ 是四边形 $BCDE$ 内的一点，满足 $AC \parallel ED$ 和 $AD \parallel BC$。
已知 $\angle ABC = \angle AED$ 和 $AB = AE$。
```

---

## GitHub 集成

项目已连接到 GitHub 仓库，每次保存检查点（checkpoint）时会自动同步到 `main` 分支。

### 查看 GitHub 仓库

访问：https://github.com/a19978101099-boop/math-ai-tutor

### 断开 GitHub 连接

如果需要断开连接并使用新的 GitHub 仓库：

1. 在 Manus 管理界面的"Settings → GitHub"面板点击"Disconnect"
2. 连接到新的 GitHub 仓库
3. 推送当前代码到新仓库

### 手动推送到 GitHub

```bash
git add .
git commit -m "Update project"
git push origin main
```

---

## 性能优化建议

### 1. 图片优化

- 压缩题目和答案图片（推荐使用 WebP 格式）
- 使用 CDN 加速图片加载
- 实现图片懒加载

### 2. 数据库优化

- 为 `problems` 表的 `title` 字段添加索引
- 为 `progress` 表的 `userId` 和 `problemId` 字段添加复合索引
- 定期清理过期的进度记录

### 3. 前端优化

- 使用 React.memo 优化组件渲染
- 实现虚拟滚动（当题目数量超过 100 道时）
- 使用 Code Splitting 减少首屏加载时间

---

## 扩展功能建议

### 1. 错题本系统

自动记录学生获取提示次数超过 3 次的题目，提供"我的错题本"页面。

### 2. 题目分类和筛选

为题目添加标签（代数、几何、三角函数等），支持按章节和难度筛选。

### 3. 批量上传功能

支持一次上传多张图片，AI 自动识别并创建多道题目。

### 4. 实时预览

在管理员上传页面添加 LaTeX 实时预览，方便检查格式。

### 5. LaTeX 快捷输入

提供常用数学符号按钮，一键插入正确的 LaTeX 代码。

---

## 技术支持

如果遇到任何问题，请：

1. 检查开发服务器日志：`.manus-logs/devserver.log`
2. 检查浏览器控制台错误：`.manus-logs/browserConsole.log`
3. 查阅项目 README：`/home/ubuntu/math-ai-tutor/README.md`
4. 向 Manus AI 描述具体的错误信息

---

## 附录

### 项目文件结构

```
math-ai-tutor/
├── client/                 # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── pages/         # 页面组件
│       │   ├── Home.tsx
│       │   ├── ProblemDetail.tsx
│       │   ├── Progress.tsx
│       │   └── AdminUpload.tsx
│       ├── components/    # UI 组件
│       ├── lib/           # 工具库
│       │   └── trpc.ts    # tRPC 客户端
│       └── App.tsx        # 路由配置
├── server/                # 后端代码
│   ├── routers.ts         # tRPC 路由
│   ├── db.ts              # 数据库查询
│   └── _core/             # 框架核心
│       ├── llm.ts         # LLM API
│       └── context.ts     # tRPC 上下文
├── drizzle/               # 数据库
│   └── schema.ts          # 数据库表结构
├── package.json           # 依赖配置
└── README.md              # 项目文档
```

### 有用的命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 推送数据库 schema
pnpm db:push

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

---

**文档版本**：2.0  
**最后更新**：2026-01-28  
**作者**：Manus AI
