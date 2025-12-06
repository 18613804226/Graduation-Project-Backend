// src/certificate/certificate.module.ts
import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [CommonModule],
  controllers: [CertificateController],
  providers: [CertificateService, PrismaService],
  exports: [CertificateService], // ✅ 必须导出
})
export class CertificateModule {}
