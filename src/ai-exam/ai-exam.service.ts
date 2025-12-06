// src/ai/ai.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; // ✅ 新增
import { firstValueFrom } from 'rxjs'; // ✅ 用于转换 Observable → Promise
import { ConfigService } from '@nestjs/config'; // ✅ 推荐方式获取 env

import { SaveToBankDto } from './dto/save-to-bank.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishExamDto } from './dto/publish-exam.dto';
import { GenerateQuestionDto } from './dto/generate-question.dto';
import { GeneratedQuestion } from './dto/generated-question.dto';
import { JudgeExamDto } from './dto/judge-xam.dto';
import { CertificateService } from '../certificate/certificate.service'; // ✅ 引入
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ExamTemplateService } from '../exam-template/exam-template.service';

type Option = string | { key?: string; text?: string };
// Section 生成结果类型
interface SectionResult {
  items: {
    id: number;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
  type: string;
  sectionId: number;
  score?: number;
}

@Injectable()
export class AiService {
  DASHSCOPE_API_KEY: string;
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService, // ✅ 注入
    private configService: ConfigService, // ✅ 获取配置
    private certificateService: CertificateService,
    private activityLogService: ActivityLogService,
    private examTemplateService: ExamTemplateService,
  ) {
    this.DASHSCOPE_API_KEY =
      this.configService.get<string>('DASHSCOPE_API_KEY')!;
    if (!this.DASHSCOPE_API_KEY) {
      throw new Error('DASHSCOPE_API_KEY is not defined in environment');
    }
  }

  async generateQuestions(
    dto: GenerateQuestionDto,
  ): Promise<GeneratedQuestion[]> {
    const { templateId, difficulty: difficultyOverride } = dto;

    const template: any = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      include: { sections: true },
    });

    if (!template || !template.sections?.length) {
      throw new Error('未找到模板或模板无题型配置');
    }

    // console.log('📌 模板信息:', {
    //   id: template.id,
    //   name: template.name,
    //   difficulty: template.difficulty,
    //   sections: template.sections,
    // });

    const difficulty = (
      difficultyOverride ||
      template.difficulty ||
      'medium'
    ).trim();

    const tasks = template.sections.map((section) =>
      this.generateSectionQuestions({
        templateName: template.name,
        difficulty,
        section,
      }),
    );

    const sectionResults = await Promise.allSettled(tasks);

    let gid = 1;
    const merged: GeneratedQuestion[] = [];

    for (const result of sectionResults) {
      if (result.status === 'fulfilled') {
        const { items, type, sectionId, score, rawContent } = result.value;

        if (!items.length) {
          console.warn(
            `⚠️ Section ${sectionId} 返回空数组，原始内容:`,
            rawContent,
          );
        }

        for (const item of items) {
          merged.push({
            id: gid++,
            type,
            question: item.question,
            options: item.options,
            answer: item.answer,
            explanation:
              item.explanation || item.analysis || item.rationale || '',
            sectionId,
            score,
          });
        }
      } else {
        console.error('❌ Section 生成失败:', result.reason);
      }
    }

    if (!merged.length) {
      throw new Error('AI 服务暂时不可用或未生成任何题目');
    }

    return merged;
  }

  // 调用通义ai
  private async generateSectionQuestions(params: {
    templateName: string;
    difficulty: string;
    section: {
      id: number;
      questionType: string;
      count: number;
      score?: number;
    };
  }): Promise<{
    items: any[];
    type: string;
    sectionId: number;
    score?: number;
    rawContent?: string;
  }> {
    const { templateName, difficulty, section } = params;

    // 动态批大小策略
    let batchSize = 4;
    if (section.count <= 10) {
      batchSize = section.count;
    } else if (section.count > 20) {
      batchSize = 8;
    }

    const batches = Math.ceil(section.count / batchSize);

    // 根据题型生成不同 Prompt
    const buildPrompt = (questionType: string) => {
      switch (questionType) {
        case 'single':
          return `
          Generate ${batchSize} ${difficulty}-level single choice questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","options":["A. ...","B. ..."],"answer":"A","explanation":"..."}
          ]
        `;
        case 'multiple':
          return `
          Generate ${batchSize} ${difficulty}-level multiple choice questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","options":["A. ...","B. ...","C. ..."],"answer":["A","C"],"explanation":"..."}
          ]
        `;
        case 'true_false':
          return `
          Generate ${batchSize} ${difficulty}-level true/false questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","answer":true,"explanation":"..."}
          ]
        `;
        case 'essay':
          return `
          Generate ${batchSize} ${difficulty}-level essay questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","answer":"Reference Answer Text","explanation":"..."}
          ]
        `;
        case 'coding':
          return `
          Generate ${batchSize} ${difficulty}-level coding questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","answer":{"language":"JavaScript","code":"function foo() {...}"},"explanation":"..."}
          ]
        `;
        default:
          return `
          Generate ${batchSize} ${difficulty}-level questions on "${templateName}".
          Return ONLY a JSON array like:
          [
            {"question":"...","options":["A. ...","B. ..."],"answer":"A","explanation":"..."}
          ]
        `;
      }
    };

    const tasks = Array.from({ length: batches }).map((_, i) => {
      const prompt = buildPrompt(section.questionType);

      return this.httpService
        .post(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          {
            model: 'qwen-turbo',
            input: { messages: [{ role: 'user', content: prompt }] },
          },
          {
            headers: {
              Authorization: `Bearer ${this.DASHSCOPE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();
    });

    const results: any = await Promise.allSettled(tasks);

    let allItems: any[] = [];
    let rawContents: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        let text = result.value.data?.output?.text?.trim();
        rawContents.push(text);

        if (text?.startsWith('```json')) {
          text = text.slice(7, -3).trim();
        } else if (text?.startsWith('```')) {
          text = text
            .replace(/^```[\s\S]*?\n/, '')
            .replace(/```$/, '')
            .trim();
        }

        try {
          const parsed: any[] = JSON.parse(text);

          const validated = parsed.map((item) => {
            switch (section.questionType) {
              case 'single':
                return {
                  question: item.question || '',
                  options: item.options || [],
                  answer: item.answer || '',
                  explanation: item.explanation || 'No explanation',
                };
              case 'multiple':
                return {
                  question: item.question || '',
                  options: item.options || [],
                  answer: Array.isArray(item.answer) ? item.answer : [],
                  explanation: item.explanation || 'No explanation',
                };
              case 'true_false':
                return {
                  question: item.question || '',
                  answer:
                    typeof item.answer === 'boolean' ? item.answer : false,
                  explanation: item.explanation || 'No explanation',
                };
              case 'essay':
                return {
                  question: item.question || '',
                  answer: item.answer || '',
                  explanation: item.explanation || 'No explanation',
                };
              case 'coding':
                return {
                  question: item.question || '',
                  answer: item.answer || { language: 'unknown', code: '' },
                  explanation: item.explanation || 'No explanation',
                };
              default:
                return {
                  question: item.question || '',
                  options: item.options || [],
                  answer: item.answer || '',
                  explanation: item.explanation || 'No explanation',
                };
            }
          });

          allItems = allItems.concat(validated);
        } catch (e) {
          console.error('❌ JSON 解析失败:', text);
        }
      } else {
        console.error('❌ 批次生成失败:', result.reason);
      }
    }

    return {
      items: allItems,
      type: section.questionType,
      sectionId: section.id,
      score: section.score,
      rawContent: rawContents.join('\n---\n'),
    };
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
      const cleanOptions = Array.isArray(q.options)
        ? q.options.map((opt: string) => opt.trim())
        : [];
      const normalizedAnswer = q.answer?.trim() || '';

      // ✅ 使用统一哈希函数
      const optionsHash = this.generateOptionsHash(cleanOptions);

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
          options: cleanOptions,
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
  /**
   * 设置当前考试试卷（会清空旧试卷！）
   */
  async setCurrentExam(dto: PublishExamDto) {
    const {
      templateId,
      subject = 'General',
      difficulty = 'Medium',
      questions,
    } = dto;

    if (!questions || questions.length === 0) {
      throw new BadRequestException('题目列表不能为空');
    }

    let title = '未命名试卷';
    let duration = 0;
    if (templateId) {
      const template = await this.prisma.examTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new BadRequestException('模板不存在');
      }
      title = template.name;
      duration = template.duration;
    }

    await this.prisma.publishedExam.updateMany({ data: { isCurrent: false } });
    await this.prisma.examQuestion.updateMany({
      data: { isCurrentExam: false },
    });

    const exam = await this.prisma.publishedExam.create({
      data: {
        title,
        subject,
        difficulty,
        createdBy: dto.createdBy || 'system',
        status: 'active',
        isCurrent: true,
        templateId: templateId || null,
        duration,
      },
    });

    function normalizeAnswer(answer: any): string {
      if (typeof answer === 'string') return answer.trim();
      if (Array.isArray(answer))
        return answer.map((a) => a.trim?.() || a).join(',');
      if (typeof answer === 'boolean') return answer ? 'true' : 'false';
      if (typeof answer === 'object' && answer.code)
        return answer.code.trim?.() || '';
      return '';
    }

    let insertedCount = 0;

    for (const q of questions) {
      const normalizedQuestion = q.question?.trim() || '';
      const cleanOptions = Array.isArray(q.options)
        ? q.options.map((opt: string) => opt.trim())
        : [];
      const questionType = (q.type || q.questionType || 'single').toLowerCase();
      const normalizedAnswer = normalizeAnswer(q.answer);

      // ✅ 使用统一哈希函数
      const optionsHash = this.generateOptionsHash(cleanOptions);

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
          isCurrentExam: true,
          score: q.score || 10,
          publishedExamId: exam.id,
        },
      });

      insertedCount++;
    }

    const fullExam: any = await this.prisma.publishedExam.findUnique({
      where: { id: exam.id },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            questionType: true,
            score: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    return {
      message: `当前考试试卷已更新，共 ${insertedCount} 道题`,
      examId: fullExam.id,
      title: fullExam.title,
      subject: fullExam.subject,
      difficulty: fullExam.difficulty,
      questions: fullExam.questions,
    };
  }

  async getCurrentExam() {
    const exam = await this.prisma.publishedExam.findFirst({
      where: { isCurrent: true },
      include: {
        // template: true, // ✅ 加上模板
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            questionType: true,
            // ⚠️ Do not return answer/explanation during exam
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new BadRequestException('当前无有效试卷，请联系管理员');
    }
    return {
      examId: exam.id,
      title: exam.title,
      subject: exam.subject,
      difficulty: exam.difficulty,
      questions: exam.questions,
      duration: exam.duration, // ✅ 直接用冗余字段
    };
  }

  async autoJudgeExam(dto: JudgeExamDto) {
    const { examId, answers } = dto;

    const questions = await this.prisma.examQuestion.findMany({
      where: {
        isCurrentExam: true,
        publishedExamId: examId,
      },
      select: {
        id: true,
        question: true,
        options: true,
        answer: true,
        questionType: true,
        score: true,
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException('当前无有效试卷');
    }

    let totalScore = 0;

    for (const q of questions) {
      const userAns = findUserAnswer(answers, q.id);
      if (userAns == null) continue;

      const type = normalizeType(q.questionType);
      let isCorrect = false;

      switch (type) {
        case 'single':
          isCorrect = isSingleCorrect(userAns, q.answer);
          break;
        case 'multiple':
          isCorrect = isMultipleCorrect(userAns, q.answer); // ✅ 新增
          break;
        case 'true_false':
          isCorrect =
            String(userAns).trim().toLowerCase() ===
            String(q.answer).trim().toLowerCase();
          break;
        case 'essay':
        case 'coding':
          isCorrect = await this.aiJudge(q.question, q.answer, userAns);
          break;
        default:
          isCorrect = false;
      }

      totalScore += isCorrect ? (q.score ?? 0) : 0;
    }

    return totalScore;
  }

  // ✅ AI 判题函数（修复：使用 this.DASHSCOPE_API_KEY）
  private async aiJudge(
    question: string,
    correctAnswer: string,
    userAnswer: any,
  ): Promise<boolean> {
    const prompt = `
你是一个考试评分助手，请根据以下内容判断用户答案是否正确，只返回 true 或 false。

题目：${question}
标准答案：${typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer) : correctAnswer}
用户答案：${typeof userAnswer === 'object' ? JSON.stringify(userAnswer) : userAnswer}
`;

    try {
      const res: any = await this.httpService
        .post(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          {
            model: 'qwen-turbo',
            input: {
              messages: [{ role: 'user', content: prompt }],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.DASHSCOPE_API_KEY}`, // ✅ 修复点
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();

      const text = res.data?.output?.text?.trim().toLowerCase();
      if (!text) return false;

      return (
        /(true|yes|正确|对)/i.test(text) && !/(false|no|错误|错)/i.test(text)
      );
    } catch (err) {
      console.error('AI 判题失败:', err);
      return false;
    }
  }

  /**
   * 提交考试：判分 → 保存成绩 → 自动发证
   */
  async submitExam(
    dto: JudgeExamDto,
    currentUser: { id: number; username?: string },
  ) {
    // 输入校验
    if (!currentUser?.id) {
      throw new BadRequestException('当前用户不存在或未登录');
    }
    if (!dto?.examId) {
      throw new BadRequestException('缺少考试ID');
    }

    // 计时与结构化日志
    console.time('submitExam');
    console.time('autoJudge');

    // 1 判分（带兜底）
    let totalScore = 0;
    try {
      totalScore = await this.autoJudgeExam(dto);
      if (!Number.isFinite(totalScore) || totalScore < 0) {
        totalScore = 0;
      }
    } catch (e) {
      console.error('autoJudge失败:', { examId: dto.examId, error: String(e) });
      // 测试阶段允许继续，兜底分数
      totalScore = 0;
    } finally {
      console.timeEnd('autoJudge');
    }

    // 2 获取考试与模板
    const exam = await this.prisma.publishedExam.findUnique({
      where: { id: dto.examId },
      include: { template: true },
    });
    if (!exam) {
      throw new BadRequestException('考试不存在');
    }
    const template = exam.template;
    if (!template) {
      throw new BadRequestException('试卷模板不存在');
    }
    if (!template.courseId) {
      throw new BadRequestException('模板未绑定课程，无法发证');
    }

    // 3 计算是否通过（测试阶段强制通过）
    const passed = true; // 正式上线改回：totalScore >= (template.passingScore ?? 60)

    // 4 事务：写入成绩 + 发证
    // console.time('tx');
    try {
      const result: any = await this.prisma.$transaction(async (tx) => {
        // 4.1 保存考试结果（附带 user 信息以便取用户名）
        const examResult = await tx.examResult.create({
          data: {
            userId: currentUser.id,
            examId: dto.examId,
            score: totalScore,
            passed,
          },
          include: { user: true },
        });

        // 4.2 通过则发证（查重改用 userId + courseId）
        let certificate: unknown = null;
        if (passed) {
          const existing = await tx.certificate.findFirst({
            where: {
              userId: currentUser.id,
              courseId: template.courseId!,
            },
          });

          if (!existing) {
            const username =
              currentUser.username ??
              examResult.user?.username ??
              `user-${currentUser.id}`;

            certificate = await tx.certificate.create({
              data: {
                userId: currentUser.id,
                username, // 显示用，不参与唯一约束
                courseId: template.courseId!,
                templateId: template.id!,
              },
            });
          }
        }

        return { examResult, certificate };
      });

      // ✅✅✅ 2️⃣ 事务成功后，异步记录动态（不阻塞主流程）
      if (passed) {
        // 获取用户名（优先用传入的，兜底查数据库）
        const userName =
          currentUser.username ||
          result.examResult.user?.username ||
          `User${currentUser.id}`;

        // Record "Exam Passed"
        const computedTemplate = await this.examTemplateService.findOne(
          dto.examId,
        );
        await this.activityLogService.createLog(
          currentUser.id,
          'exam_passed',
          `${userName} passed <a> "${exam.title}" <a/> (Score: ${totalScore}/${computedTemplate.totalScore ?? 100})`,
          {
            targetId: dto.examId,
            targetType: 'Exam',
            isPublic: true,
          },
        );

        // If a new certificate was issued, record "Certificate Issued"
        if (result.certificate) {
          await this.activityLogService.createLog(
            currentUser.id,
            'certificate_issued',
            `${userName} received the <a>"${template.name}"<a/> electronic certificate`,
            {
              targetId: result.certificate.id,
              targetType: 'Certificate',
              isPublic: true,
            },
          );
        }
      }

      // console.timeEnd('tx');

      return {
        examResult: result.examResult,
        totalScore,
        passed,
        certificateCreated: Boolean(result.certificate),
        message: passed
          ? result.certificate
            ? 'Exam passed, certificate generated'
            : 'The exam has been passed and the certificate is already in existence.'
          : '考试未通过，请继续努力',
      };
    } catch (e) {
      console.timeEnd('tx');
      console.error('事务失败:', {
        examId: dto.examId,
        userId: currentUser.id,
        error: String(e),
      });
      throw new BadRequestException(
        'Exam submission failed, please try again later.',
      );
    } finally {
      console.timeEnd('submitExam');
    }
  }
  /**
   * 生成用于去重的选项哈希值（排序 + 小写 + 拼接）
   * @param options 选项数组，如 ["A. Vue", "B. React"]
   * @returns 哈希字符串，如 "a. vue|b. react"
   */
  private generateOptionsHash(options: string[]): string {
    return options
      .map((opt) => opt.trim().toLowerCase())
      .sort()
      .join('|');
  }
}
/* ------------------ 工具函数 ------------------ */
/** 单选题判定 */
// 单选题判定（简单版）
/** 单选题判定 */
function isSingleCorrect(userRaw: unknown, correctRaw: unknown): boolean {
  const getKey = (s: unknown) => {
    const str = String(s ?? '').trim();
    if (/^[A-Z]$/i.test(str)) return str.toUpperCase();
    const m = str.match(/^([A-Z])[\.\)\s、-]?/i);
    return m ? m[1].toUpperCase() : str.toLowerCase();
  };
  return getKey(userRaw) === getKey(correctRaw);
}

/**
 * 多选题判定（完全匹配，顺序无关）
 */
function isMultipleCorrect(userRaw: unknown, correctRaw: string): boolean {
  const parseToKeys = (ans: unknown): string[] => {
    if (Array.isArray(ans)) {
      return ans.map((item) => String(item).trim().toUpperCase());
    }
    if (typeof ans === 'string') {
      return ans
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map((s) => {
          const match = s.match(/^([A-Z])/i);
          return match ? match[1].toUpperCase() : s.toUpperCase();
        });
    }
    return [];
  };

  const userKeys = new Set(parseToKeys(userRaw));
  const correctKeys = new Set(parseToKeys(correctRaw));

  if (userKeys.size !== correctKeys.size) return false;
  for (const key of correctKeys) {
    if (!userKeys.has(key)) return false;
  }
  return true;
}

function findUserAnswer(
  answers: { questionId: unknown; userAnswer: unknown }[],
  qid: unknown,
) {
  return answers.find((a) => String(a.questionId) === String(qid))?.userAnswer;
}

function normalizeType(
  t: unknown,
): 'single' | 'multiple' | 'true_false' | 'essay' | 'coding' | undefined {
  const s = String(t ?? '')
    .trim()
    .toLowerCase();
  if (['single', 'single_choice'].includes(s)) return 'single';
  if (['multiple', 'multiple_choice'].includes(s)) return 'multiple';
  if (['true_false', 'boolean'].includes(s)) return 'true_false';
  if (['essay', 'text'].includes(s)) return 'essay';
  if (['coding', 'code'].includes(s)) return 'coding';
  return undefined;
}
