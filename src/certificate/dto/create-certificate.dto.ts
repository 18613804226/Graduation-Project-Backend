// src/certificate/dto/create-certificate.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  username: string;

  @IsNumber()
  courseId: number;

  @IsNumber()
  templateId: number;
}
