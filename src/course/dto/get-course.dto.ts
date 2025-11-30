// src/course/dto/get-course.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GetCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  search?: string; // 模糊搜索课程名或描述

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  pageSize?: number = 10;
}
