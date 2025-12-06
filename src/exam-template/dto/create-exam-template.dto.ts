import { IsString, IsInt, Min, ArrayMinSize } from 'class-validator';

export class CreateExamTemplateDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  // 👇 新增 courseId 字段
  @IsInt() // 如果数据库里是数字类型
  @Min(1)
  courseId: number;

  @ArrayMinSize(1)
  sections: ExamSectionDto[];
}

export class ExamSectionDto {
  @IsString()
  questionType: string;

  @IsInt()
  @Min(1)
  count: number;

  @IsInt()
  @Min(1)
  score: number;
}
