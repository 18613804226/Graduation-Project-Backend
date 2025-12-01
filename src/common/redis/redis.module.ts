// src/common/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService], // 👈 必须导出！
})
export class RedisModule {}
