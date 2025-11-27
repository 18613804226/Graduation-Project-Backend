// src/agora/agora.module.ts
import { Module } from '@nestjs/common';
import { TencentService } from './tencent.service';
import { TencentController } from './tencent.controller';

@Module({
  providers: [TencentService],
  controllers: [TencentController],
})
export class TencentModule {}
