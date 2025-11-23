// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service'; // 用于 /auth/codes

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService],
})
export class AuthModule {}
