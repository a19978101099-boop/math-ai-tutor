/**
 * 图片下载脚本
 * 用途：批量下载所有 S3 图片到本地
 * 运行方式：npx tsx migration/download-images.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

async function downloadImages() {
  console.log("开始下载图片...");

  try {
    // 读取图片 URL 列表
    const urlsPath = "./migration/image-urls.txt";
    if (!existsSync(urlsPath)) {
      console.error(`❌ 找不到文件: ${urlsPath}`);
      console.log("请先运行: npx tsx migration/export-database.ts");
      process.exit(1);
    }

    const urls = readFileSync(urlsPath, "utf-8")
      .split("\n")
      .filter((url) => url.trim());

    console.log(`找到 ${urls.length} 个图片 URL`);

    // 创建下载目录
    const downloadDir = "./migration/downloaded-images";
    if (!existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true });
    }

    // 下载每个图片
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] 下载: ${url}`);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        
        // 从 URL 提取文件名
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split("/").pop() || `image-${i + 1}.jpg`;
        
        const filepath = join(downloadDir, filename);
        writeFileSync(filepath, Buffer.from(buffer));
        
        console.log(`   ✅ 已保存: ${filename}`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ 下载失败: ${error}`);
        failCount++;
      }
    }

    console.log("\n📊 下载摘要:");
    console.log(`   - 成功: ${successCount}`);
    console.log(`   - 失败: ${failCount}`);
    console.log(`   - 保存位置: ${downloadDir}`);

    // 生成文件名映射表
    const mapping: Record<string, string> = {};
    urls.forEach((url, index) => {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split("/").pop() || `image-${index + 1}.jpg`;
      mapping[url] = filename;
    });

    const mappingPath = "./migration/url-filename-mapping.json";
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf-8");
    console.log(`   - 文件名映射: ${mappingPath}`);
  } catch (error) {
    console.error("❌ 下载失败:", error);
    process.exit(1);
  }

  process.exit(0);
}

downloadImages();
