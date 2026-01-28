/**
 * 数据库导出脚本
 * 用途：导出所有题目数据和图片 URL，方便迁移到新账号
 * 运行方式：npx tsx migration/export-database.ts
 */

import { getDb } from "../server/db";
import { problems } from "../drizzle/schema";
import { writeFileSync } from "fs";

async function exportDatabase() {
  console.log("开始导出数据库...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❗ 数据库连接失败");
      process.exit(1);
    }

    // 查询所有题目
    const allProblems = await db.select().from(problems);

    console.log(`找到 ${allProblems.length} 道题目`);

    // 生成 JSON 格式的导出数据
    const exportData = {
      exportDate: new Date().toISOString(),
      totalProblems: allProblems.length,
      problems: allProblems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        description: problem.description,
        problemText: problem.problemText,
        problemImageUrl: problem.problemImageUrl,
        answerImageUrl: problem.answerImageUrl,
        knownConditions: problem.knownConditions,
        steps: problem.steps,
        createdAt: problem.createdAt,
      })),
    };

    // 保存为 JSON 文件
    const jsonPath = "./migration/exported-data.json";
    writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), "utf-8");
    console.log(`✅ 数据已导出到: ${jsonPath}`);

    // 生成图片 URL 列表
    const imageUrls: string[] = [];
    allProblems.forEach((problem) => {
      if (problem.problemImageUrl) {
        imageUrls.push(problem.problemImageUrl);
      }
      if (problem.answerImageUrl) {
        imageUrls.push(problem.answerImageUrl);
      }
    });

    const urlsPath = "./migration/image-urls.txt";
    writeFileSync(urlsPath, imageUrls.join("\n"), "utf-8");
    console.log(`✅ 图片 URL 列表已导出到: ${urlsPath}`);
    console.log(`   共 ${imageUrls.length} 个图片文件`);

    // 生成 SQL 导入脚本
    const sqlStatements: string[] = [];
    allProblems.forEach((problem) => {
      const escapeSql = (str: string | null) => {
        if (!str) return "NULL";
        return `'${str.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
      };

      const sql = `INSERT INTO problems (id, title, description, problemText, problemImageUrl, answerImageUrl, knownConditions, steps, createdAt) VALUES (
  ${problem.id},
  ${escapeSql(problem.title)},
  ${escapeSql(problem.description)},
  ${escapeSql(problem.problemText)},
  ${escapeSql(problem.problemImageUrl)},
  ${escapeSql(problem.answerImageUrl)},
  ${escapeSql(problem.knownConditions)},
  ${escapeSql(problem.steps)},
  ${problem.createdAt ? `'${problem.createdAt.toISOString()}'` : "NOW()"}
);`;
      sqlStatements.push(sql);
    });

    const sqlPath = "./migration/import-problems.sql";
    writeFileSync(sqlPath, sqlStatements.join("\n\n"), "utf-8");
    console.log(`✅ SQL 导入脚本已生成: ${sqlPath}`);

    console.log("\n📊 导出摘要:");
    console.log(`   - 题目数量: ${allProblems.length}`);
    console.log(`   - 图片数量: ${imageUrls.length}`);
    console.log(`   - JSON 数据: ${jsonPath}`);
    console.log(`   - 图片列表: ${urlsPath}`);
    console.log(`   - SQL 脚本: ${sqlPath}`);
  } catch (error) {
    console.error("❌ 导出失败:", error);
    process.exit(1);
  }

  process.exit(0);
}

exportDatabase();
