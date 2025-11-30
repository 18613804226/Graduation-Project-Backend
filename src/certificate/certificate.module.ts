// src/certificate/certificate.module.ts
import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommonModule } from '../common/common.module';
import { PdfService } from 'src/common/pdf/pdf.service';
@Module({
  imports: [CommonModule],
  controllers: [CertificateController],
  providers: [CertificateService, PrismaService, PdfService],
})
export class CertificateModule {}
