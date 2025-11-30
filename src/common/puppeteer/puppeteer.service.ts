// src/common/puppeteer/puppeteer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: puppeteer.Browser;

  async onModuleInit() {
    // 尝试自动查找 Puppeteer 下载的 Chrome 路径
    let executablePath = puppeteer.executablePath();
    console.log('🔍 __dirname:', __dirname);
    console.log(
      '🔍 Project root (3x ..):',
      path.resolve(__dirname, '..', '..', '..', '..'),
    );
    console.log('🔍 Chrome path:', executablePath);
    console.log('✅ File exists?', fs.existsSync(executablePath));
    // 如果默认路径不存在（Render 环境常见），手动构造路径
    if (!fs.existsSync(executablePath)) {
      // const platform = 'linux'; // Render 是 Linux
      // const version = '142.0.7444.175'; // 你的错误日志中的版本
      executablePath = path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        '.local-chromium',
        'chrome',
        'linux-142.0.7444.175',
        'chrome',
      );
    }

    this.browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process', // Render 内存限制
        '--disable-software-rasterizer',
      ],
    });
    console.log('✅ Puppeteer browser launched with path:', executablePath);
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
