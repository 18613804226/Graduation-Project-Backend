// src/common/middleware/visit-log.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VisitLogMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // 在响应结束后记录日志
    res.on('finish', async () => {
      const duration = Date.now() - startTime;

      // 忽略静态资源、健康检查等无意义请求
      if (
        req.path.startsWith('/health') ||
        req.path.startsWith('/metrics') ||
        /\.(js|css|png|jpg|ico)$/.test(req.path)
      ) {
        return;
      }

      try {
        // 从 req.user 获取当前登录用户（需 JWT 鉴权已生效）
        const userId = (req as any).user?.id || null;

        await this.prisma.visitLog.create({
          data: {
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration,
          },
        });
      } catch (error) {
        console.error('Failed to log visit:', error);
      }
    });

    next();
  }
}
