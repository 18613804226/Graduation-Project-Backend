// src/ai-exam/dto/save-to-bank.dto.ts
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 可选：定义题目项的结构（更严格）
class QuestionItem {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsString()
  explanation: string;

  @IsArray()
  @IsString({ each: true })
  options?: string[]; // 选择题才有
}

export class SaveToBankDto {
  @IsString()
  subject: string;

  @IsString()
  difficulty: string;

  @IsString()
  questionType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionItem) // 告诉 class-transformer 如何反序列化
  questions: QuestionItem[];
}
