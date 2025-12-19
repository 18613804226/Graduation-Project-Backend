// src/notification/dto/create-notification.dto.ts
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  type: string;

  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
