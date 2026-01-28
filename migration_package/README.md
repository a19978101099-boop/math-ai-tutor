# Math AI Tutor 迁移包

## 包含文件

本迁移包包含以下文件，用于在新 Manus 账号中完整恢复 Math AI Tutor 项目：

| 文件名 | 说明 |
|-------|------|
| `README.md` | 本文件，迁移包概述 |
| `MIGRATION_GUIDE.md` | 完整的迁移指南，包含技术细节和故障排除 |
| `NEW_ACCOUNT_PROMPT.md` | 新账号初始化提示词，直接复制使用 |
| `problems_data.json` | 题目数据（2 道预置题目） |
| `users_structure.json` | 用户表结构（仅供参考） |

## 快速开始

### 方法 1：使用提示词（推荐）

1. 打开 `NEW_ACCOUNT_PROMPT.md`
2. 复制其中的提示词
3. 在新 Manus 账号中开启对话
4. 粘贴提示词并发送
5. 等待 Manus AI 完成初始化
6. 按照提示导入 `problems_data.json`

### 方法 2：手动操作

如果您熟悉 Manus 平台和 Git 操作，可以手动执行：

1. 在新 Manus 账号中创建项目
2. 从 GitHub 克隆代码：`https://github.com/a19978101099-boop/math-ai-tutor.git`
3. 安装依赖：`pnpm install`
4. 推送数据库：`pnpm db:push`
5. 启动服务器：`pnpm dev`
6. 导入题目数据（使用 `problems_data.json`）

## 项目信息

- **项目名称**: Math AI Tutor
- **GitHub 仓库**: https://github.com/a19978101099-boop/math-ai-tutor.git
- **技术栈**: React 19 + tRPC 11 + MySQL + Manus LLM API
- **模板**: Manus tRPC + Database + User Auth
- **题目数量**: 2 道（可通过管理员上传功能添加更多）

## 重要提示

### 关于图片

题目和答案图片存储在原账号的 S3 中。迁移到新账号后，您可能需要：

1. 重新上传图片到新账号的 S3
2. 或使用管理员上传功能重新创建题目

详细处理方法请参考 `MIGRATION_GUIDE.md` 的"常见问题"部分。

### 关于管理员权限

默认情况下，新注册的用户角色为 `user`。要使用题目上传功能，需要将账号设置为 `admin`。

在对话中要求 Manus AI 帮您设置：

```
请将我的账号设置为管理员（role = 'admin'）
```

### 关于环境变量

项目使用的所有环境变量（数据库连接、LLM API 密钥、OAuth 配置等）都由 Manus 平台自动注入，无需手动配置。

## 文档说明

### MIGRATION_GUIDE.md

完整的技术文档，包含：

- 项目概述和技术栈
- 详细的迁移步骤
- 数据库结构说明
- 核心功能说明
- 项目文件结构
- 常见问题和解决方案
- 后续开发建议

适合需要深入了解项目技术细节的开发者。

### NEW_ACCOUNT_PROMPT.md

简化的初始化提示词，包含：

- 直接可用的提示词（复制粘贴即可）
- 初始化后的后续步骤
- 常见问题的快速解决方案
- 功能验证清单

适合快速恢复项目的用户。

## 支持

如果在迁移过程中遇到问题：

1. 查看 `MIGRATION_GUIDE.md` 的"常见问题"部分
2. 在对话中向 Manus AI 询问具体问题
3. 检查项目的 `todo.md` 了解功能实现细节
4. 查看 `server/*.test.ts` 了解 API 使用方法

## 版本信息

- **迁移包版本**: 1.0
- **项目版本**: dd575f3b
- **创建日期**: 2026-01-28
- **创建者**: Manus AI

---

祝您迁移顺利！
