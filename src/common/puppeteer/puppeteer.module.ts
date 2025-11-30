// src/common/puppeteer/puppeteer.module.ts
import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';

@Module({
  providers: [PuppeteerService],
  exports: [PuppeteerService], // 👈 允许其他模块使用
})
export class PuppeteerModule {}
