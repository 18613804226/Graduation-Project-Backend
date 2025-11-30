// get-certificate.dto.ts
import { IsOptional, IsNumber, Min } from 'class-validator';

export class GetCertificateDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  username?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  courseId?: number;

  @IsOptional()
  search?: string;
}
