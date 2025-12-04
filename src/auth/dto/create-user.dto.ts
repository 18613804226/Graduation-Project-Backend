// src/auth/dto/create-user.dto.ts
import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsOptional() // 👈 改成可选（移除 @IsNotEmpty）
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string; // 👈 新增

  @IsString()
  @IsOptional() // 👈 改成可选（因为数据库允许 null）
  name?: string;

  @IsOptional()
  role?: 'USER' | 'ADMIN' | 'STUDENT' | 'MODERATOR';
}
