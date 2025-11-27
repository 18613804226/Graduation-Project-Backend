import { IsArray, IsString, IsNumber, ArrayMinSize } from 'class-validator';

export class PublishExamDto {
  @IsString()
  title: string;

  @IsString()
  subject: string;

  @IsString()
  difficulty: string;

  @IsString()
  questionType: string;

  @IsString()
  createdBy: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  questionIds: number[]; // ← 用于从题库中选题

  // ✅ 新增：如果要传题目内容（不是 ID），就加这个
  @IsArray()
  @ArrayMinSize(1)
  questions?: {
    // 👈 可选字段，用于 AI 直接生成题目
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }[];
}
