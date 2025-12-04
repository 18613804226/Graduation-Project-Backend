// src/auth/dto/register.dto.ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  //   @IsString()
  //   @IsEmail()
  //   email: string;

  @IsString()
  @MinLength(3)
  password: string;

  @IsString()
  username: string;
}
