import mysql from 'mysql2/promise';
import { invokeLLM } from './server/_core/llm.ts';

async function updateProblems() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 获取所有题目
  const [problems] = await conn.execute('SELECT id, problemImageUrl, solutionImageUrl FROM problems');
  
  console.log(`找到 ${problems.length} 道题目，开始重新提取中英文文字...`);
  
  for (const problem of problems) {
    console.log(`\n处理题目 ID: ${problem.id}`);
    
    const messages = [
      {
        role: 'system',
        content: '你是一个数学题目分析助手。请从题目图片中提取：1) 中文题目文字（完整内容，数学公式用 LaTeX 格式，用 $ 包裹）；2) 英文题目文字（完整内容，数学公式用 LaTeX 格式，用 $ 包裹）。'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请从以下图片中提取中文和英文题目文字：' },
          { type: 'image_url', image_url: { url: problem.problemImageUrl } }
        ]
      }
    ];
    
    try {
      const response = await invokeLLM({
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'text_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                problemText: { type: 'string', description: '中文题目文字' },
                problemTextEn: { type: 'string', description: '英文题目文字' }
              },
              required: ['problemText', 'problemTextEn'],
              additionalProperties: false
            }
          }
        }
      });
      
      console.log('LLM Response:', JSON.stringify(response, null, 2));
      const content = response.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        const parsed = JSON.parse(content);
        await conn.execute(
          'UPDATE problems SET problemText = ?, problemTextEn = ? WHERE id = ?',
          [parsed.problemText, parsed.problemTextEn, problem.id]
        );
        console.log(`题目 ${problem.id} 更新成功`);
        console.log(`中文: ${parsed.problemText.substring(0, 80)}...`);
        console.log(`英文: ${parsed.problemTextEn.substring(0, 80)}...`);
      }
    } catch (error) {
      console.error(`题目 ${problem.id} 更新失败:`, error.message);
    }
  }
  
  await conn.end();
  console.log('\n所有题目更新完成！');
}

updateProblems().catch(console.error);
