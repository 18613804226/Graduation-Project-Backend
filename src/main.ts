// src/main.ts
process.env.TZ = 'Europe/Minsk'; // 👈 设置时区（OK）
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './exception.filter';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// import { JwtAuthGuard } from './auth/jwt-auth.guard';
// import { RolesGuard } from './auth/guards/roles.guard';

// 可选：加载 .env（你注释掉了，也可以保留）
// const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production';
// if (envFile && fs.existsSync(envFile)) {
//   dotenv.config({ path: envFile });
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 设置 CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5777';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // 2. 设置全局前缀
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除 DTO 中未定义的字段
      forbidNonWhitelisted: false,
      transform: true, // 👈 关键！把 "1" 自动转成 1
      transformOptions: {
        enableImplicitConversion: true, // 👈 允许隐式转换
      },
      exceptionFactory: (errors) => {
        console.error('❌ Validation Errors:', errors);
        return new BadRequestException(
          errors
            .map((err: any) => Object.values(err.constraints)[0])
            .toString(),
        );
      },
    }),
  );
  // 5. ✅ 全局异常过滤器（必须在 listen 之前！）
  app.useGlobalFilters(new AllExceptionsFilter());

  // 6. 🟢 最后启动服务
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);

  // 7. 启动后日志
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
  console.log('✅=============后端服务启动成功==========✅');
  console.log(`🚀 Listening on port ${port}`);
}

bootstrap();
