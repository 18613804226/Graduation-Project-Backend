import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer-core'; // 👈 用 puppeteer-core
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: any;

  async onModuleInit() {
    // 动态查找最新版本目录
    const chromeDir = path.join(__dirname, '../../../chrome');
    const versionDirs = fs
      .readdirSync(chromeDir)
      .filter((dir) => dir.startsWith('linux-'));

    if (versionDirs.length === 0) {
      throw new Error(`❌ No Chrome version found in ${chromeDir}`);
    }

    const latestVersionDir = versionDirs.sort().reverse()[0];
    const executablePath = path.join(
      chromeDir,
      latestVersionDir,
      'chrome-linux64/chrome',
    );

    console.log('🔍 Using Chrome version:', latestVersionDir);
    console.log('✅ Executable exists?', fs.existsSync(executablePath));

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
