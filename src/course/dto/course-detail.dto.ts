// src/course/dto/course-detail.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { ContentBlockDto } from './content-block.dto';

export class TeacherDto {
  @ApiProperty({ example: 101, description: '教师用户ID' })
  id: number;

  @ApiProperty({ example: '张老师', description: '教师昵称' })
  nickname: string;

  username: string;
}

export class LessonDto {
  @ApiProperty({ example: 1, description: '课时ID' })
  id: number;

  @ApiProperty({ example: 'HTML 简介', description: '课时标题' })
  title: string;

  @ApiProperty({ example: true, description: '当前登录用户是否已完成该课时' })
  completed: boolean;

  // 👇 关键：添加 content 字段 👇
  @ApiProperty({
    type: [ContentBlockDto],
    description: '课时富内容（支持文本、视频等）',
    required: false, // 👈 可选
  })
  content?: ContentBlockDto[]; // 👈 用 ? 表示可选，或默认空数组
}

export class ExamTemplateDto {
  @ApiProperty({ example: 1, description: '考试模板ID' })
  id: number;

  @ApiProperty({ example: '期末考试', description: '考试名称' })
  name: string;

  @ApiProperty({ example: 60, description: '考试时长（分钟）' })
  duration: number;
}

export class CourseDetailDto {
  @ApiProperty({ example: 1, description: '课程ID' })
  id: number;

  @ApiProperty({ example: 'HTML + CSS 入门课程', description: '课程标题' })
  title: string;

  @ApiProperty({
    example: '适合零基础学习者，从标签到布局全面讲解。',
    description: '课程描述',
  })
  description: string;

  @ApiProperty({
    example: '/uploads/cover_html_css.jpg',
    description: '课程封面图路径',
  })
  cover: string;

  @ApiProperty({ example: 'Frontend Development', description: '课程分类' })
  category: string;

  @ApiProperty({
    example: '2023-12-01T10:00:00.000Z',
    description: '课程创建时间（ISO 8601 格式）',
  })
  createdAt: string;

  @ApiProperty({ type: () => TeacherDto, description: '授课教师信息' })
  teacher: TeacherDto;

  @ApiProperty({
    type: [LessonDto],
    description: '课程包含的课时列表（含用户完成状态）',
  })
  lessons: LessonDto[];

  @ApiProperty({
    type: [ExamTemplateDto],
    description: '关联的考试模板列表',
  })
  examTemplates: ExamTemplateDto[];
}
