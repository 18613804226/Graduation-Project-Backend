// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// 设置环境
const envFile =
  process.env.NODE_ENV === 'development'
    ? '.env.development'
    : '.env.production';

if (envFile && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  console.warn(`⚠️ ${envFile} not found`);
}
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

@Injectable()
export class AiService {
  async generateQuestions(dto: any): Promise<any[]> {
    const { subject, difficulty, questionType, count } = dto;

    const prompt = `
你是一名资深${subject}企业培训讲师，请严格按照以下要求生成 ${count} 道 ${difficulty} 难度的 ${questionType}：
1. 输出必须是纯 JSON 数组，不要任何额外文字或 Markdown。
2. 每道题包含字段：id（从1开始）、question（题目）、answer（答案）、explanation（解析）。
3. 如果是选择题，还需包含 options 字段（字符串数组，如 ["A. 苹果", "B. 香蕉"]），answer 写选项字母（如 "A"）。
4. 填空题 answer 是正确答案字符串；简答题 answer 是参考答案。

示例（单选题）：
[{"id":1,"question":"地球是平的吗？","options":["A. 是","B. 不是"],"answer":"B","explanation":"科学已证实地球是近似球体。"}]
`;

    try {
      const res = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          model: 'qwen-plus',
          input: { messages: [{ role: 'user', content: prompt }] },
        },
        {
          headers: {
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      if (res.data.error) {
        throw new Error(`AI 错误: ${res.data.error.message}`);
      }
      const content = res.data.output?.text;
      if (!content) {
        throw new Error('AI 未返回有效内容');
      }

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7, -3).trim();
      }

      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('AI 调用失败:', error.response?.data || error.message);
      throw new Error('AI 服务暂时不可用，请稍后再试');
    }
  }
}
