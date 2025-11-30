// src/certificate/certificate.module.ts
import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PuppeteerService } from '../common/puppeteer/puppeteer.service';
@Module({
  controllers: [CertificateController],
  providers: [CertificateService, PrismaService, PuppeteerService],
})
export class CertificateModule {}
