// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

// Guards
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard'; // 👈 新增
import { VisitLogMiddleware } from './common/middleware/visit-log.middleware';
import { AppService } from './app.service';
// import { UserService } from './user/user.service';
// import { AiService } from './ai-exam/ai-exam.service';
// import { VideoService } from './video/video.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { TencentModule } from './tencentRtc/tencent.module';
import { ExamTemplateModule } from './exam-template/exam-template.module';
import { CertificateModule } from './certificate/certificate.module';
import { VideoMoudle } from './video/vodeo.moudle';
import { AIExamModule } from './ai-exam/ai-exam.moudle';
import { WeatherModule } from './weather/weather.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TrackModule } from './track/track.module';
import { HealthModule } from './health/health.module';
@Module({
  controllers: [
    /* ... */
  ],
  providers: [
    AppService,

    // 全局守卫：顺序很重要！
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }, // 👈 新增
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    CourseModule,
    TencentModule,
    ExamTemplateModule,
    CertificateModule,
    VideoMoudle,
    AIExamModule,
    WeatherModule,
    DashboardModule,
    TrackModule,
    HealthModule,
    // ...其他模块
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VisitLogMiddleware).forRoutes('*');
  }
}
