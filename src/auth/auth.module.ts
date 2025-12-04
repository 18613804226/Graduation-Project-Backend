// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'; // 👈 不需要显式导入 JwtModuleOptions
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { JwtStrategy } from './jwt.strategy';
import ms from 'ms'; // 👈 导入类型
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as ms.StringValue, // ✅ 直接传 string，运行时由 @nestjs/jwt + ms 处理
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService, JwtStrategy],
  exports: [JwtStrategy, AuthService],
})
export class AuthModule {}
