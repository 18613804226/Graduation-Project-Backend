import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer-core'; // 👈 用 puppeteer-core
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: any;

  async onModuleInit() {
    const chromeRoot = path.join(__dirname, '../../../chrome');

    console.log('🔍 Looking for Chrome in:', chromeRoot);
    console.log(
      '📁 Available files in dist/:',
      fs.readdirSync(path.join(__dirname, '../../..')),
    );

    if (!fs.existsSync(chromeRoot)) {
      console.error('❌ chromeRoot does NOT exist!');
      throw new Error(`Chrome root directory not found: ${chromeRoot}`);
    }

    const versionDirs = fs
      .readdirSync(chromeRoot)
      .filter((d) => d.startsWith('linux-'));
    console.log('📦 Found version dirs:', versionDirs);

    if (versionDirs.length === 0) {
      throw new Error(`❌ No Chrome version found in ${chromeRoot}`);
    }

    const latestVersionDir = versionDirs.sort().reverse()[0];
    const executablePath = path.join(
      chromeRoot,
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
