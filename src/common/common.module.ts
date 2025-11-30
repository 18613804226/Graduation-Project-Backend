// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class CommonModule {}
