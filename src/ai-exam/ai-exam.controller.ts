// src/ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { AiService } from './ai-exam.service';
import { GenerateQuestionDto } from './dto/generate-question.dto';
import { success, fail } from 'src/common/dto/response.dto';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { SaveToBankDto } from './dto/save-to-bank.dto';
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
@Controller('ai-exam')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-questions')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async generateQuestions(@Body() dto: GenerateQuestionDto) {
    try {
      const questions = await this.aiService.generateQuestions(dto);
      return success(questions);
    } catch (error) {
      console.error('AI 调用失败:', error);
      return fail('AI 服务暂时不可用，请稍后再试');
    }
  }
  // src/ai-exam.controller.ts
  @Post('review-questions')
  async reviewQuestions(@Body() dto: { questions: any[] }) {
    try {
      const prompt = `
 你是一名资深企业培训专家，请对以下题目进行专业评审：
 1. 评分标准：内容准确性（30%）、难度匹配度（20%）、选项合理性（20%）、语言表达（15%）、教育价值（15%）
 2. 输出格式为 JSON，包含：
   - overallScore: 总分（满分100）
   - strengths: 优点（字符串数组）
   - weaknesses: 不足（字符串数组）
   - suggestions: 改进建议（字符串数组）
   - detailedFeedback: 每道题的详细点评（数组，每个元素为 { id, feedback }）

 示例输出：
 {
  "overallScore": 85,
  "strengths": ["题目覆盖了核心知识点", "选项设计合理"],
  "weaknesses": ["部分题目难度偏高", "个别选项表述不够清晰"],
  "suggestions": ["建议增加填空题提升记忆效果", "优化选项措辞避免歧义"],
  "detailedFeedback": [
    { "id": 1, "feedback": "该题考察点准确，但A选项与B选项语义相近，易混淆" },
    { "id": 2, "feedback": "题目很好，答案明确" }
  ]
 }`;

      const res = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          model: 'qwen-plus', // 更智能的模型
          input: {
            messages: [
              {
                role: 'user',
                content: prompt + '\n\n' + JSON.stringify(dto.questions),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      let content = res.data.output.text.trim();
      if (content.startsWith('```json')) {
        content = content.slice(7, -3).trim();
      }

      const result = JSON.parse(content);
      return success(result);
    } catch (error) {
      console.error('AI 审题失败:', error);
      return fail('AI 审题服务暂时不可用');
    }
  }
  @Post('save-to-bank')
  async saveToBank(@Body() dto: SaveToBankDto) {
    const result = await this.aiService.saveToQuestionBank(dto);
    return success({
      success: true,
      message: 'Successfully saved to the question bank',
    });
  }

  @Post('start-exam')
  async startExam(
    @Body()
    body: {
      subject: string;
      difficulty: string;
      questionType: string;
      count: number;
    },
  ) {
    const questions = await this.aiService.getRandomExam(
      body.subject,
      body.difficulty,
      body.questionType,
      body.count,
    );

    return success(questions);
  }
  // ✅ 发布固定试卷（管理员/AI调用）
  @Post('publish')
  async publishExam(@Body() dto: PublishExamDto) {
    this.aiService.setCurrentExam(dto);
    return success({ success: true, message: 'Published successfully' });
  }

  @Get('current')
  async getCurrentExam() {
    const data = await this.aiService.getCurrentExam();
    return success(data);
  }
}
