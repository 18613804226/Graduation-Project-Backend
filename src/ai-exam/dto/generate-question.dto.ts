// src/ai/dto/generate-question.dto.ts
import { IsString, IsIn, IsInt, Min, Max } from 'class-validator';

export class GenerateQuestionDto {
  @IsString()
  // @IsIn(['安全', '技术', '管理', '合规'])
  subject: string;

  @IsString()
  // @IsIn(['简单', '中等', '困难'])
  difficulty: string;

  @IsString()
  // @IsIn(['单选题', '多选题', '填空题', '简答题'])
  questionType: string;

  @IsInt()
  @Min(1)
  @Max(30)
  count: number;
}
