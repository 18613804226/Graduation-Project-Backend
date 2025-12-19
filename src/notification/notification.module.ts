// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from '../../prisma/prisma.service'; // 请根据你的实际路径调整
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, NotificationGateway],
  exports: [NotificationService], // ⚠️ 关键：让其他模块可以注入使用
})
export class NotificationModule {}
