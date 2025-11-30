import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer-core'; // 👈 用 puppeteer-core
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: any;

  async onModuleInit() {
    // 获取当前文件所在目录
    const currentDir = __dirname;
    console.log('🔍 Current directory:', currentDir);

    // 回退到 project root
    const projectRoot = path.join(currentDir, '../../..'); // src/src → project root
    console.log('📁 Project root:', projectRoot);

    // 查找 dist/chrome
    const chromeRoot = path.join(projectRoot, 'dist', 'chrome');
    console.log('🔍 Looking for Chrome in:', chromeRoot);

    if (!fs.existsSync(chromeRoot)) {
      console.error('❌ chromeRoot does NOT exist!');
      throw new Error(`Chrome root directory not found: ${chromeRoot}`);
    }

    // 查找 linux-xxx 目录
    const versionDirs = fs
      .readdirSync(chromeRoot)
      .filter((d) => d.startsWith('linux-'));
    if (versionDirs.length === 0) {
      throw new Error(`No Chrome version found in ${chromeRoot}`);
    }

    const latestVersion = versionDirs.sort().reverse()[0];
    const executablePath = path.join(
      chromeRoot,
      latestVersion,
      'chrome-linux64',
      'chrome',
    );

    console.log('🎯 Final executablePath:', executablePath);
    console.log('✅ File exists?', fs.existsSync(executablePath));

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
