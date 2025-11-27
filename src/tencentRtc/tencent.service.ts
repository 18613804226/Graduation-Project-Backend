// src/tencent/tencent.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as tls from 'tls-sig-api-v2';
import genUserSig from 'tls-sig-api-v2';
@Injectable()
export class TencentService {
  private sdkAppId: number;
  private secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.sdkAppId = this.configService.getOrThrow<number>('TENCENT_SDK_APP_ID');
    this.secretKey =
      this.configService.getOrThrow<string>('TENCENT_SECRET_KEY');

    if (!this.sdkAppId || !this.secretKey) {
      throw new Error(
        'Missing TENCENT_SDK_APP_ID or TENCENT_SECRET_KEY in .env',
      );
    }
  }

  /**
   * 生成腾讯云 UserSig（用于 TRTC + TIM）
   * @param userId 用户唯一 ID（字符串）
   * @param expire 有效期（秒，默认 7 天）
   * @returns UserSig 字符串
   */
  generateUserSig(userId: string, expire: number = 604800): string {
    if (!userId) {
      throw new Error('userId is required');
    }

    // 创建 API 实例
    const api = new genUserSig.Api(this.sdkAppId, this.secretKey);

    // 生成签名
    const userSig = api.genSig(userId, expire);

    return userSig;
  }
}
