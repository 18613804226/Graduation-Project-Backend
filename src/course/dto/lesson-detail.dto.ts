// src/course/dto/lesson-detail.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LessonDetailDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 'Vue 响应式原理' })
  title: string;

  @ApiProperty({
    example: '深入讲解 Vue 3 的 reactivity 系统',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: '<p>这里是富文本内容...</p>', required: false })
  content?: string;

  @ApiProperty({ example: 'https://example.com/video.mp4', required: false })
  videoUrl?: string;

  @ApiProperty({ example: 'video', enum: ['text', 'video', 'audio'] })
  type: string;

  @ApiProperty({ example: 3 })
  order: number;

  @ApiProperty({ example: 50 })
  courseId: number;

  @ApiProperty({ example: '前端框架进阶' })
  courseTitle: string;

  @ApiProperty({ example: true })
  completed: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
