import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
async function bootstrap() {
  // 根据 NODE_ENV 决定是否加载 .env 文件
  const envFile =
    process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env.production';

  if (envFile && fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
  // / 根据环境设置 CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5777';
  const app = await NestFactory.create(AppModule);
  // ✅ 正确方式：使用 Nest 内置方法
  app.enableCors({
    origin: frontendUrl, // 前端地址
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
  console.log('=============后端服务启动成功==========');
}
bootstrap();
