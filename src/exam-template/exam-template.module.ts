import { Module } from '@nestjs/common';
import { ExamTemplateController } from './exam-template.controller';
import { ExamTemplateService } from './exam-template.service';

@Module({
  controllers: [ExamTemplateController],
  providers: [ExamTemplateService],
})
export class ExamTemplateModule {}
