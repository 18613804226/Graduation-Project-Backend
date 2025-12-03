// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 👇 不再手动导入 PrismaService！
import { AuthController } from './auth/auth.controller';
import { HealthController } from './health/health.controller';
import { UserController } from './user/user.controller';
import { AiController } from './ai-exam/ai-exam.controller';
import { VideoController } from './video/video.controller';

// Services（但 PrismaService 应由 PrismaModule 提供）
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';
import { AiService } from './ai-exam/ai-exam.service';
import { VideoService } from './video/video.service';

// Modules
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TencentModule } from './tencentRtc/tencent.module';
import { ExamTemplateModule } from './exam-template/exam-template.module';
import { CertificateModule } from './certificate/certificate.module';
import { CourseModule } from './course/course.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';

// Guard
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// 👇 新增：访问日志中间件
import { VisitLogMiddleware } from './common/middleware/visit-log.middleware';
import { TrackModule } from './track/track.module';

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
    AiService,
    VideoService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // ❌ 移除 PrismaService 手动注册！
    // 它应该由 PrismaModule 导出并全局提供
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    PrismaModule, // ✅ PrismaService 从此模块来
    AuthModule,
    TencentModule,
    ExamTemplateModule,
    CertificateModule,
    CourseModule,
    CommonModule,
    DashboardModule,
    TrackModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VisitLogMiddleware).forRoutes('*'); // 全局应用中间件
  }
}
