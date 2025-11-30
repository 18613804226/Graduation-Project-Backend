import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 只导入一次
import { AuthController } from './auth/auth.controller';
import { HealthController } from './health/health.controller';
import { AuthService } from './auth/auth.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module'; // 👈 引入 AuthModule
import { AiController } from './ai-exam/ai-exam.controller';
import { AiService } from './ai-exam/ai-exam.service';
import { VideoController } from './video/video.controller';
import { VideoService } from './video/video.service';
import { ConfigModule } from '@nestjs/config';
import { TencentModule } from './tencentRtc/tencent.module';
import { ExamTemplateModule } from './exam-template/exam-template.module';
import { CertificateModule } from './certificate/certificate.module';
import { CourseModule } from './course/course.module';
import { CommonModule } from './common/common.module'; // 👈 导入模块
@Module({
  controllers: [
    AppController,
    AuthController,
    UserController,
    HealthController,
    AiController,
    VideoController,
  ],
  providers: [
    AppService,
    AuthService,
    UserService,
    PrismaService,
    AiService,
    VideoService,
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    PrismaModule,
    AuthModule,
    TencentModule,
    ExamTemplateModule,
    CertificateModule,
    CourseModule,
    CommonModule,
  ],
})
export class AppModule {}
