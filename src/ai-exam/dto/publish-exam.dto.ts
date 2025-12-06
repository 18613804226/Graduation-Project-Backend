import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PublishExamDto {
  @IsOptional()
  @IsInt() // ✅ 模板 ID 是整数
  templateId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  // ✅ 可选：科目
  @IsOptional()
  @IsString()
  subject?: string;

  // ✅ 可选：难度
  @IsOptional()
  @IsString()
  difficulty?: string;

  // ✅ 可选：题型
  @IsOptional()
  @IsString()
  questionType?: string;

  // ✅ 方式一：通过题库 ID 选题
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  questionIds?: number[];

  // ✅ 方式二：直接传题目内容
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  questions?: {
    score: number;
    questionType: string | undefined;
    question: string;
    options?: string[]; // ✅ 某些题型可能没有选项
    answer: any; // ✅ 支持 string | string[] | boolean | object
    explanation?: string;
    type?: string; // ✅ 新增题型字段，如 'single' | 'multiple' | 'true_false' | 'essay' | 'coding'
  }[];

  validate() {
    if (!this.questionIds && !this.questions) {
      throw new Error('必须提供 questionIds 或 questions 中至少一个');
    }
  }
}
