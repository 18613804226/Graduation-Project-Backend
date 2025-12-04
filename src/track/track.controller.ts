// src/track/track.controller.ts
import { Controller, Post, Req, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrackService } from './track.service';
import { success } from 'src/common/dto/response.dto';

@Controller('track')
export class TrackController {
  constructor(private trackService: TrackService) {}
  @Post('page-view')
  async recordPageView(@Req() req, @Body() body: { path?: string }) {
    const ip = req.ip;
    const userId = req.user?.id; // Guard 保证存在，但加个 ?. 更安全
    const path = body?.path ?? '/'; // ✅ 关键修复：防止 body 为 undefined

    await this.trackService.recordPageView(ip, userId, path);
    return success({ success: true });
  }
}
