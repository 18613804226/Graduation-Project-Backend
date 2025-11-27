// src/api/video/video.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { VideoService } from './video.service';
import { GetVideoUrlDto } from './dto/get-video-url.dto';
import { success } from 'src/common/dto/response.dto';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('get-url')
  async getVideoUrl(@Body() dto: GetVideoUrlDto) {
    const result = await this.videoService.getSignedVideoUrl(dto.lessonId);
    return success(result);
  }
}
