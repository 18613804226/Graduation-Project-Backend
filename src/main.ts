import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // / 根据环境设置 CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5777';
  const app = await NestFactory.create(AppModule);
  // ✅ 正确方式：使用 Nest 内置方法
  app.enableCors({
    origin: frontendUrl, // 前端地址
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log('=============后端服务启动成功==========');
}
bootstrap();
