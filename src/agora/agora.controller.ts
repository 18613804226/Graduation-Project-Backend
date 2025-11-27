// // src/agora/agora.controller.ts
// import { Controller, Get, Query, Res } from '@nestjs/common';
// import { AgoraService } from './agora.service';
// import { success } from 'src/common/dto/response.dto';

// @Controller('agora')
// export class AgoraController {
//   constructor(private readonly agoraService: AgoraService) {}

//   @Get('token')
//   getToken() {
//     // @Query('uid') uid?: string, // @Query('channelName') channelName: string,
//     // 自动生成频道名和用户 ID
//     const channelName = '298693544706049'; // 或动态生成，如 `room_${Date.now()}`
//     const account = `guest_${Date.now()}`;
//     const token = this.agoraService.generateRtcToken(channelName, account);
//     return success({
//       token,
//       appId: process.env.AGORA_APP_ID,
//       channelName,
//       uid: account,
//     });
//   }
// }
