import { IsString, IsInt, Min, ArrayMinSize } from 'class-validator';

export class CreateExamTemplateDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

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
