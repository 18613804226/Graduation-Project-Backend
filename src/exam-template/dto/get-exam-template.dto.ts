import { ExamSectionDto } from './create-exam-template.dto';

export class GetExamTemplateDto {
  id: number;
  name: string;
  duration: number;
  sections: ExamSectionDto[];
}
