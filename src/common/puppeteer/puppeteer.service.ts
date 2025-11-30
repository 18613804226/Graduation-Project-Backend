import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: puppeteer.Browser;

  async onModuleInit() {
    let executablePath = puppeteer.executablePath();
    console.log('🔍 Default Puppeteer executablePath:', executablePath);
    console.log('✅ Default path exists?', fs.existsSync(executablePath));

    if (!fs.existsSync(executablePath)) {
      throw new Error(`Browser not found at ${executablePath}`);
    }

    // 7. 启动浏览器
    try {
      this.browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--disable-software-rasterizer',
        ],
      });
      console.log('✅ Puppeteer browser launched successfully!');
    } catch (error) {
      console.error('❌ Puppeteer launch failed:', error.message);
      throw error;
    }
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
