// src/certificate/dto/update-certificate.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
