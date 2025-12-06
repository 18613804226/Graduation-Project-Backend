import { Module } from '@nestjs/common';
import { AiController } from './ai-exam.controller';
import { AiService } from './ai-exam.service';
import { HttpModule } from '@nestjs/axios'; // ✅ 必须导入
import { ConfigModule } from '@nestjs/config'; // ✅ 必须导入（用于 ConfigService）
import { CertificateModule } from 'src/certificate/certificate.module';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';
import { ExamTemplateModule } from 'src/exam-template/exam-template.module';
@Module({
  imports: [
    HttpModule, // ✅ 提供 HttpService
    ConfigModule, // ✅ 提供 ConfigService（如果没全局注册）
    CertificateModule,
    ActivityLogModule,
    ExamTemplateModule,
    // 其他模块...
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AIExamModule {}
