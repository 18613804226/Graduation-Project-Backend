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

    // 回退到 dist/ 目录
    const distDir = path.join(currentDir, '../../..'); // src/dist/src/common → dist/
    console.log('📁 dist dir:', distDir);
    // 🔥 新增：打印 dist/ 目录下的所有文件和文件夹
    try {
      const distContents = fs.readdirSync(distDir);
      console.log('📦 Contents of dist/:', distContents);
    } catch (err) {
      console.error('💥 Failed to read dist/ directory:', err.message);
      throw new Error('Cannot access dist/ folder');
    }
    // 查找 chrome
    const chromeRoot = path.join(distDir, 'chrome');
    console.log('🔍 Looking for Chrome in:', chromeRoot);
    console.log('📁 Exists?', fs.existsSync(chromeRoot));

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
