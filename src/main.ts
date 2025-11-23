import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
   // ✅ 正确方式：使用 Nest 内置方法
  app.enableCors({
    origin: 'http://localhost:5777', // 前端地址
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log('=============后端服务启动成功==========');
}
bootstrap();
