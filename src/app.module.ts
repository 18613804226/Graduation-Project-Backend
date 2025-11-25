import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { HealthController } from './health/health.controller';
import { AuthService } from './auth/auth.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth/auth.module'; // 👈 引入 AuthModule
import { AiController } from './ai-exam/ai-exam.controller';
import { AiService } from './ai-exam/ai-exam.service';
@Module({
  imports: [AuthModule],
  controllers: [
    AppController,
    AuthController,
    UserController,
    HealthController,
    AiController,
  ],
  providers: [AppService, AuthService, UserService, PrismaService, AiService],
})
export class AppModule {}
