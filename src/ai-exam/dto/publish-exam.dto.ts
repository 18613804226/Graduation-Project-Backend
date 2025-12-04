import {
  IsArray,
  IsString,
  IsNumber,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class PublishExamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  subject: string;

  @IsString()
  difficulty: string;

  @IsString()
  questionType: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  // ✅ 方式一：通过题库 ID 选题（可选）
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @IsOptional()
  questionIds?: number[];

  // ✅ 方式二：直接传题目内容（可选）
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  questions?: {
    id?: number;
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }[];

  // ✅ 新增：必须传一个（要么 questionIds，要么 questions）
  validate() {
    if (!this.questionIds && !this.questions) {
      throw new Error('必须提供 questionIds 或 questions 中至少一个');
    }
  }
}
