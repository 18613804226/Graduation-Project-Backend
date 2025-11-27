// src/api/video/dto/get-video-url.dto.ts
import { IsString } from 'class-validator';

export class GetVideoUrlDto {
  @IsString()
  lessonId: string;
}
