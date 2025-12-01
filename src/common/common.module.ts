// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule], // 👈 关键！
  providers: [PdfService],
  exports: [PdfService],
})
export class CommonModule {}
