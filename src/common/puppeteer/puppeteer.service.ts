// src/common/puppeteer/puppeteer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: puppeteer.Browser;

  async onModuleInit() {
    // 启动一次浏览器（整个应用生命周期只启动一次）
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // 防止内存不足
        '--disable-gpu',
      ],
      // 可选：限制内存
      // executablePath: '/usr/bin/chromium-browser', // Docker 中指定路径
    });
    console.log('✅ Puppeteer browser launched');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      console.log('🛑 Puppeteer browser closed');
    }
  }

  getBrowser(): puppeteer.Browser {
    return this.browser;
  }
}
