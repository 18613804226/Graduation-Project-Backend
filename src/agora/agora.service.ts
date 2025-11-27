// // src/agora/agora.service.ts
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

// @Injectable()
// export class AgoraService {
//   constructor(private readonly configService: ConfigService) {}

//   /**
//    * 生成 Agora RTC Token
//    * @param channelName 房间名（如课程ID）
//    * @param uid 用户ID（0 表示自动分配）
//    * @returns Token 字符串
//    */
//   generateRtcToken(channelName: string, account: string): string {
//     const appId = this.configService.get<string>('AGORA_APP_ID');
//     const appCertificate = this.configService.get<string>(
//       'AGORA_APP_CERTIFICATE',
//     );

//     if (!appId || !appCertificate) {
//       throw new Error('Agora APP_ID or APP_CERTIFICATE not configured in .env');
//     }
//     const role = RtcRole.PUBLISHER; // 或 RtcRole.SUBSCRIBER
//     const expirationTimeInSeconds = 3600; // 1小时过期
//     const currentTimestamp = Math.floor(Date.now() / 1000);
//     const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

//     const rawToken = RtcTokenBuilder.buildTokenWithAccount(
//       appId,
//       appCertificate,
//       channelName,
//       account,
//       role,
//       privilegeExpiredTs,
//     );

//     console.log('[DEBUG] Raw Token Length:', rawToken.length);
//     console.log('[DEBUG] Raw Token Sample:', rawToken);
//     return rawToken;
//   }
// }
