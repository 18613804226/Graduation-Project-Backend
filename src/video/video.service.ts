// src/api/video/video.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class VideoService {
  private readonly SECRET_KEY =
    process.env.VIDEO_SECRET_KEY || 'your-secret-key-for-signing';

  // 模拟腾讯云点播签名逻辑（实际项目替换为真实签名）
  async getSignedVideoUrl(lessonId: string): Promise<{ url: string }> {
    // 模拟视频文件名（实际应从数据库查）
    const fileName = `${lessonId}.m3u8`;
    const baseUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    // 生成时间戳（1小时有效）
    const timestamp = Math.floor(Date.now() / 1000) + 3600;

    // 生成签名字符串
    const signStr = `file=${fileName}&t=${timestamp}`;
    const sign = crypto.createHash('sha256').update(signStr).digest('hex');

    // 构造带签名的 URL
    // const signedUrl = `${baseUrl}${fileName}?t=${timestamp}&sign=${sign}`;
    const signedUrl = baseUrl;

    return { url: signedUrl };
  }
}
