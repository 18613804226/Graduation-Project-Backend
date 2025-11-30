import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer-core'; // 👈 用 puppeteer-core
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: any;

  async onModuleInit() {
    // 正确路径：从 dist/src/common/puppeteer 回退到 dist/
    const executablePath = path.join(
      __dirname,
      '../../../.cache/puppeteer/chrome/linux-142.0.7444.175/chrome-linux64/chrome',
    );

    console.log('🔍 Final executablePath:', executablePath);
    console.log('✅ File exists?', fs.existsSync(executablePath));

    if (!fs.existsSync(executablePath)) {
      throw new Error(`❌ Chrome binary not found at ${executablePath}`);
    }

    this.browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    console.log('✅ Puppeteer launched successfully!');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      console.log('🛑 Puppeteer closed');
    }
  }

  getBrowser() {
    return this.browser;
  }
}
