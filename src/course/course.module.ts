// src/course/course.module.ts
import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [
    ActivityLogModule,
    // 其他模块如 PrismaModule（如果需要）
  ],
  controllers: [CourseController],
  providers: [CourseService, PrismaService],
})
export class CourseModule {}
