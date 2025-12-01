// dto/get-course.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';

export class GetCourseDto {
  @IsOptional()
  @IsString()
  title?: string;
  search?: string;
  teacher?: string;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number) // 👈 关键：自动转 number
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number) // 👈 关键
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
