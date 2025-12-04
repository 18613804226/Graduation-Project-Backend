// src/auth/dto/guest-login.dto.ts
import { IsOptional } from 'class-validator';

export class GuestLoginDto {
  @IsOptional()
  name?: string;
}
