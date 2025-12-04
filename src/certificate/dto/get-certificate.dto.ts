// get-certificate.dto.ts
import {
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  ValidateIf,
} from 'class-validator';

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
  role?: string;

  // ✅ 只有当 startDate 不为空时，才校验是否为日期
  @ValidateIf((o) => o.startDate !== undefined && o.startDate !== '')
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ValidateIf((o) => o.endDate !== undefined && o.endDate !== '')
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
