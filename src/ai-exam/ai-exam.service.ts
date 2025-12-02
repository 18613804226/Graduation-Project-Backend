// src/ai/ai.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { SaveToBankDto } from './dto/save-to-bank.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishExamDto } from './dto/publish-exam.dto';

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
  constructor(private prisma: PrismaService) {}

  async generateQuestions(dto: any): Promise<any[]> {
    const { subject, difficulty, questionType, count } = dto;

    const prompt = `
你是一名资深${subject}企业培训讲师，请用英语严格按照以下要求生成 ${count} 道 ${difficulty} 难度的 ${questionType}：
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

  /**
   * ✅ 存储时自动去重：逐题检查是否存在，只插入新题目
   */
  async saveToQuestionBank(dto: SaveToBankDto) {
    const { subject, difficulty, questionType, questions } = dto;

    if (!questions || questions.length === 0) {
      throw new BadRequestException('题目列表不能为空');
    }

    let insertedCount = 0;
    const duplicates: any = [];

    for (const q of questions) {
      const normalizedQuestion = q.question.trim();
      // ✅ 正确：直接处理为干净的字符串数组
      const cleanOptions = Array.isArray(q.options)
        ? q.options.map((opt: string) => opt.trim())
        : [];
      const normalizedAnswer = q.answer?.trim() || '';
      // ✅ 2. 生成用于去重的哈希（排序 + 小写 + 拼接）
      const optionsHash = cleanOptions
        .map((opt) => opt.toLowerCase())
        .sort()
        .join('|');
      const existing = await this.prisma.examQuestion.findFirst({
        where: {
          subject,
          difficulty,
          questionType,
          question: normalizedQuestion,
          answer: normalizedAnswer,
          optionsHash,
        },
      });

      if (existing) {
        duplicates.push(q);
        continue;
      }

      await this.prisma.examQuestion.create({
        data: {
          subject,
          difficulty,
          questionType,
          question: normalizedQuestion,
          options: cleanOptions, // Prisma 会自动存为 JSON
          optionsHash,
          answer: normalizedAnswer,
          explanation: q.explanation?.trim() || '',
        },
      });
      insertedCount++;
    }

    return {
      message: `成功保存 ${insertedCount} 道题目到题库`,
      inserted: insertedCount,
      duplicates: duplicates.length,
    };
  }

  /** 已废弃！！
   * ✅ 查询时去重：从题库随机抽取题目，确保本次返回的题目不重复
   * ❌ 不锁定题目，允许多次考试使用同一道题
   */
  async getRandomExam(
    subject: string,
    difficulty: string,
    questionType: string,
    count: number,
  ) {
    if (count <= 0 || count > 100) {
      throw new BadRequestException('题目数量必须在 1~100 之间');
    }

    // 1. 获取所有符合条件的题目
    const allQuestions = await this.prisma.examQuestion.findMany({
      where: {
        subject,
        difficulty,
        questionType,
      },
      select: {
        id: true,
        question: true,
        options: true,
        answer: true,
        explanation: true,
      },
    });

    if (allQuestions.length === 0) {
      throw new NotFoundException('题库中没有符合条件的题目');
    }

    // 2. 内存中随机打乱 + 去重（天然不重复）
    const shuffled = this.shuffle(allQuestions);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected;
  }

  // 洗牌算法
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // ai-exam.service.ts

  /**
   * 设置当前考试试卷（会清空旧试卷！）
   */
  async setCurrentExam(dto: PublishExamDto) {
    const { subject, difficulty, questionType, questions } = dto;

    if (!questions || questions.length === 0) {
      throw new BadRequestException('题目列表不能为空');
    }

    // 🔥 关键：先清除所有当前试卷题目
    await this.prisma.examQuestion.updateMany({
      where: { isCurrentExam: true },
      data: { isCurrentExam: false },
    });

    let insertedCount = 0;

    for (const q of questions) {
      const normalizedQuestion = q.question.trim();
      const cleanOptions = Array.isArray(q.options)
        ? q.options.map((opt: string) => opt.trim())
        : [];
      const normalizedAnswer = q.answer?.trim() || '';

      const optionsHash = cleanOptions
        .map((opt) => opt.toLowerCase())
        .sort()
        .join('|');

      // 检查是否重复（可选：也可以跳过去重）
      const existing = await this.prisma.examQuestion.findFirst({
        where: {
          subject,
          difficulty,
          questionType,
          question: normalizedQuestion,
          answer: normalizedAnswer,
          optionsHash,
        },
      });

      if (existing) {
        // 如果已存在，更新它的 isCurrentExam 标记
        await this.prisma.examQuestion.update({
          where: { id: existing.id },
          data: { isCurrentExam: true },
        });
      } else {
        // 否则新建并标记为当前试卷
        await this.prisma.examQuestion.create({
          data: {
            subject,
            difficulty,
            questionType,
            question: normalizedQuestion,
            options: cleanOptions,
            optionsHash,
            answer: normalizedAnswer,
            explanation: q.explanation?.trim() || '',
            isCurrentExam: true, // 👈 标记为当前试卷
          },
        });
      }
      insertedCount++;
    }

    return {
      message: `当前考试试卷已更新，共 ${insertedCount} 道题`,
    };
  }

  // ai-exam.service.ts

  async getCurrentExam() {
    const questions = await this.prisma.examQuestion.findMany({
      where: { isCurrentExam: true },
      select: {
        id: true,
        question: true,
        options: true,
        answer: true,
        // ⚠️ 考试时不返回 answer 和 explanation！
      },
      orderBy: { id: 'asc' }, // 保证顺序一致
    });

    if (questions.length === 0) {
      throw new BadRequestException('当前无有效试卷，请联系管理员');
    }

    return questions;
  }
}
