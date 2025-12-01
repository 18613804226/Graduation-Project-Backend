// src/course/dto/create-course.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;
  name: string;
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsInt()
  teacherId: number; // 假设你知道教师 ID（后续可优化）
}
