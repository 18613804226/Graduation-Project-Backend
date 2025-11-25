// src/user/dto/update-user.dto.ts
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: '密码必须包含大小写字母、数字和特殊字符',
    },
  )
  @IsOptional()
  newPassword?: string;

  @IsString()
  @IsOptional()
  oldPassword?: string; // 用于验证当前密码

  @IsString()
  @IsOptional()
  role?: 'USER' | 'ADMIN'; // 只允许这两个值
}
