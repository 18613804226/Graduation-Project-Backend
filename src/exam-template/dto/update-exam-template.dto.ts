import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ExamSectionDto } from './create-exam-template.dto';

export class UpdateExamTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  sections?: ExamSectionDto[];
}
