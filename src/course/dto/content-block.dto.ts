// src/course/dto/content-block.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class ContentBlockDto {
  @ApiProperty({ example: 'block_1', description: '内容块唯一ID' })
  @IsString()
  id: string;

  @ApiProperty({
    example: 'text',
    enum: ['text', 'video', 'code', 'document'],
    description: '内容类型',
  })
  @IsEnum(['text', 'video', 'code', 'document'])
  type: 'text' | 'video' | 'code' | 'document'; // 👈 必须严格匹配

  @ApiProperty({
    example: '<p>Hello</p>',
    description: '文本内容（HTML）',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    example: 'https://youtu.be/xxx',
    description: '视频或文件URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;
}
