# Math AI Tutor 项目迁移指南

## 项目概述

**Math AI Tutor** 是一个专为香港 DSE 数学考试设计的智能学习平台。该平台允许管理员上传数学题目和答案图片，学生可以通过 AI 提示、苏格拉底式引导和进度追踪功能进行学习。

本文档将指导您在新的 Manus 账号中完整恢复该项目，包括代码、数据库和所有功能。

---

## 技术栈

该项目基于 Manus 平台的 **tRPC + Database + User Auth** 模板构建，具体技术栈如下：

| 技术领域 | 使用技术 |
|---------|---------|
| 前端框架 | React 19 + TypeScript |
| 样式系统 | Tailwind CSS 4 + shadcn/ui |
| 后端框架 | Express 4 + tRPC 11 |
| 数据库 | MySQL/TiDB (Drizzle ORM) |
| 认证系统 | Manus OAuth + JWT |
| AI 集成 | Manus LLM API (视觉识别 + 文本生成) |
| 数学渲染 | KaTeX |
| 语音合成 | Web Speech API |

---

## GitHub 仓库信息

项目已同步到 GitHub，可以直接从仓库克隆：

**仓库地址**: `https://github.com/a19978101099-boop/math-ai-tutor.git`

该仓库包含完整的项目代码，包括前端、后端、数据库 schema 和所有配置文件。

---

## 迁移步骤

### 第一步：在新 Manus 账号中创建对话

在新的 Manus 账号中开启一个新对话，并使用以下提示词初始化项目：

```
我需要从 GitHub 仓库恢复一个现有的 Math AI Tutor 项目。

GitHub 仓库地址：https://github.com/a19978101099-boop/math-ai-tutor.git

这是一个 DSE 数学学习平台，基于 Manus 的 tRPC + Database + User Auth 模板构建。

项目功能包括：
1. 管理员上传数学题目和答案图片
2. AI 自动识别题目文字、已知条件和解题步骤
3. 学生浏览题目并获取 AI 提示（两种模式："怎么得到这一步"和"下一步怎么思考"）
4. 苏格拉底式引导模式（通过选择题逐步引导学生理解）
5. 学习进度追踪
6. 数学公式渲染（KaTeX）
7. AI 提示语音播放

请帮我：
1. 从 GitHub 克隆项目到 Manus 环境
2. 初始化数据库（运行 pnpm db:push）
3. 启动开发服务器
4. 确认所有功能正常工作

项目使用的是 Manus 内置的 LLM API、OAuth 认证和数据库，不需要额外配置 API 密钥。
```

### 第二步：等待 Manus AI 完成初始化

Manus AI 会自动执行以下操作：

1. 从 GitHub 克隆项目代码
2. 安装依赖（`pnpm install`）
3. 推送数据库 schema（`pnpm db:push`）
4. 启动开发服务器（`pnpm dev`）
5. 验证项目运行状态

整个过程通常需要 2-3 分钟。

### 第三步：导入数据库数据

项目初始化完成后，您需要导入题目数据。在对话中发送以下消息：

```
请帮我导入题目数据。我会提供一个 JSON 文件，包含 2 道预置题目的完整数据（题目文字、图片 URL、解题步骤、已知条件等）。

请将这些数据插入到 problems 表中。
```

然后上传 `problems_data.json` 文件（包含在迁移包中）。

### 第四步：验证功能

数据导入完成后，要求 Manus AI 测试以下功能：

1. **浏览题目列表**：访问首页，确认显示 2 道题目
2. **查看题目详情**：点击题目卡片，进入详情页
3. **测试 AI 提示**：点击解题步骤，测试"怎么得到这一步"和"下一步怎么思考"两个按钮
4. **测试已知条件**：点击已知条件，查看 AI 解释
5. **测试苏格拉底模式**：点击"开始苏格拉底引导"，完成引导问题
6. **测试答案显示**：点击"查看答案"，确认答案图片正确显示
7. **测试管理员上传**：以管理员身份登录，测试上传新题目功能

---

## 数据库结构

项目使用以下数据库表：

### problems 表

存储数学题目的完整信息：

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | int (PK) | 题目 ID |
| userId | int | 上传者 ID |
| title | varchar(255) | 题目标题 |
| problemText | text | 题目文字（OCR 提取，包含 LaTeX 公式） |
| problemImageUrl | text | 题目图片 URL |
| problemImageKey | text | 题目图片 S3 key |
| solutionImageUrl | text | 答案图片 URL |
| solutionImageKey | text | 答案图片 S3 key |
| steps | text | 解题步骤（JSON 数组） |
| conditions | text | 已知条件（JSON 数组） |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### users 表

存储用户信息（Manus OAuth 自动管理）：

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | int (PK) | 用户 ID |
| openId | varchar(64) | Manus OAuth ID |
| name | text | 用户名 |
| email | varchar(320) | 邮箱 |
| role | enum | 角色（admin/user） |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |
| lastSignedIn | timestamp | 最后登录时间 |

### user_progress 表

追踪学生学习进度：

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | int (PK) | 记录 ID |
| userId | varchar(64) | 用户 openId |
| problemId | int | 题目 ID |
| viewCount | int | 查看次数 |
| hintCount | int | 获取提示次数 |
| conditionClickCount | int | 点击条件次数 |
| stepsRevealed | int | 揭示步骤数 |
| viewedSolution | int | 是否查看答案 |
| firstViewedAt | timestamp | 首次查看时间 |
| lastViewedAt | timestamp | 最后查看时间 |

---

## 核心功能说明

### 1. AI 视觉识别

使用 Manus LLM API 的视觉模型从图片中提取：

- **题目文字**：完整的中英文内容，数学公式使用 LaTeX 格式（`$...$`）
- **已知条件**：题目中明确给出的条件（如角度、边长、平行关系等）
- **解题步骤**：从答案图片中提取每一步的推理过程

相关代码位于 `server/routers.ts` 的 `extractSteps` API。

### 2. AI 提示系统

支持三种提示模式：

- **why 模式**："怎么得到这一步？" - 解释当前步骤的由来
- **next 模式**："下一步怎么思考？" - 给出下一步的思考方向
- **explainCondition 模式**：解释已知条件在解题中的作用

提示生成遵循以下原则：

- 简洁（1-4 句话）
- 不直接给出完整答案
- 引导学生思考
- 数学公式使用 LaTeX 格式

相关代码位于 `server/routers.ts` 的 `hint` API。

### 3. 苏格拉底式引导模式

通过一系列选择题逐步引导学生理解解题思路：

- 生成 3-5 个引导问题
- 每个问题包含 3-4 个选项（只有一个正确）
- 选择后立即显示反馈和解释
- 完成后显示总分

相关代码位于 `server/routers.ts` 的 `generateGuidingQuestions` API 和 `client/src/components/SocraticMode.tsx`。

### 4. 数学公式渲染

使用 KaTeX 渲染 LaTeX 格式的数学公式。所有包含 `$...$` 的文本会自动转换为渲染后的数学公式。

相关代码位于 `client/src/pages/ProblemDetail.tsx` 的 `renderMathText` 函数。

### 5. 权限系统

- **公开访问**：所有用户（包括未登录用户）可以浏览题目和获取 AI 提示
- **管理员专用**：只有角色为 `admin` 的用户可以上传新题目
- **学习进度追踪**：需要登录才能记录学习数据

管理员权限通过数据库中的 `users.role` 字段控制。要将用户设置为管理员，需要在数据库中手动修改该字段为 `admin`。

---

## 项目文件结构

```
math-ai-tutor/
├── client/                      # 前端代码
│   ├── public/                  # 静态资源
│   │   └── uploads/            # 本地上传的图片（迁移时需要复制）
│   ├── src/
│   │   ├── components/         # React 组件
│   │   │   ├── ui/            # shadcn/ui 组件
│   │   │   └── SocraticMode.tsx  # 苏格拉底模式组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── Home.tsx       # 首页（题目列表）
│   │   │   ├── ProblemDetail.tsx  # 题目详情页
│   │   │   ├── AdminUpload.tsx    # 管理员上传页面
│   │   │   └── Progress.tsx   # 学习进度页面
│   │   ├── lib/
│   │   │   └── trpc.ts        # tRPC 客户端配置
│   │   ├── App.tsx            # 路由配置
│   │   └── index.css          # 全局样式
│   └── index.html             # HTML 入口
├── server/                     # 后端代码
│   ├── _core/                 # 框架核心（不要修改）
│   ├── routers.ts             # tRPC API 路由
│   ├── db.ts                  # 数据库查询函数
│   └── *.test.ts              # 单元测试
├── drizzle/                   # 数据库
│   └── schema.ts              # 数据库 schema
├── migration_package/         # 迁移包（本文档所在目录）
│   ├── MIGRATION_GUIDE.md     # 本文档
│   ├── NEW_ACCOUNT_PROMPT.md  # 新账号初始化提示词
│   └── problems_data.json     # 题目数据
├── package.json               # 依赖配置
└── todo.md                    # 任务清单
```

---

## 常见问题

### Q1: 图片无法显示怎么办？

**原因**：图片存储在原账号的 S3 中，新账号无法直接访问。

**解决方案**：

1. 从 `problems_data.json` 中可以看到图片的 URL
2. 下载这些图片到本地
3. 在新账号中重新上传图片（使用管理员上传功能）
4. 或者要求 Manus AI 帮您批量处理图片迁移

### Q2: 如何设置管理员权限？

**方法 1**：通过数据库直接修改

```sql
UPDATE users SET role = 'admin' WHERE openId = '你的openId';
```

**方法 2**：在对话中要求 Manus AI 帮您设置

```
请将我的账号设置为管理员，这样我就可以上传新题目了。
```

### Q3: 数据库连接失败怎么办？

Manus 平台会自动配置数据库连接。如果遇到连接问题：

1. 确认项目已正确初始化（`pnpm db:push` 成功执行）
2. 检查 `.env` 文件中的 `DATABASE_URL` 是否存在（Manus 自动注入）
3. 重启开发服务器

### Q4: LLM API 调用失败怎么办？

Manus 平台自动提供 LLM API 访问权限，无需配置 API 密钥。如果遇到调用失败：

1. 检查错误日志（`.manus-logs/devserver.log`）
2. 确认网络连接正常
3. 如果是配额问题，联系 Manus 支持

### Q5: 如何添加新题目？

**方法 1**：使用管理员上传界面

1. 以管理员身份登录
2. 点击导航栏的"上传题目"按钮
3. 上传题目和答案图片
4. AI 会自动识别并提取步骤和条件
5. 预览确认后提交

**方法 2**：直接插入数据库

如果您有题目数据的 JSON 格式，可以直接插入到 `problems` 表中。

---

## 技术支持

如果在迁移过程中遇到任何问题，可以：

1. **查看项目文档**：`README.md` 包含详细的开发指南
2. **查看任务清单**：`todo.md` 记录了所有已完成和待完成的功能
3. **查看测试文件**：`server/*.test.ts` 包含功能测试示例
4. **在对话中询问 Manus AI**：Manus AI 可以帮助您调试和解决问题

---

## 后续开发建议

项目已经具备完整的核心功能，以下是一些可以考虑的优化方向：

1. **移动端优化**：在小屏幕上优化苏格拉底模式的显示方式
2. **题目收藏功能**：允许学生收藏重点题目以便复习
3. **步骤掌握标记**：让学生标记已掌握的步骤，追踪学习进度
4. **题目分类和标签**：按照 DSE 考试的章节和难度分类题目
5. **错题本功能**：记录学生经常出错的题目
6. **学习统计报表**：提供更详细的学习数据分析和可视化
7. **多语言支持**：支持繁体中文和英文界面切换

---

**文档版本**: 1.0  
**最后更新**: 2026-01-28  
**作者**: Manus AI
