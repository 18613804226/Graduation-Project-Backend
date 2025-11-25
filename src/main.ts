import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './exception.filter';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
async function bootstrap() {
  // 根据 NODE_ENV 决定是否加载 .env 文件
  const envFile =
    process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env.production';

  if (envFile && fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  } else {
    console.warn(`⚠️ ${envFile} not found`);
  }

  // / 根据环境设置 CORS
  // || 'http://localhost:5777'
  const frontendUrl = process.env.FRONTEND_URL;
  const app = await NestFactory.create(AppModule);
  // ✅ 正确方式：使用 Nest 内置方法
  app.enableCors({
    origin: frontendUrl, // 前端地址
    credentials: true,
  });
  // --
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  await app.listen(process.env.PORT ?? 3000);
  app.useGlobalFilters(new AllExceptionsFilter());
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
  console.log('✅=============后端服务启动成功==========✅');
}
bootstrap();
