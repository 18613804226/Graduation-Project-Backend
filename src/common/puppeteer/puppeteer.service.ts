import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: puppeteer.Browser;

  async onModuleInit() {
    console.log('🔍 Starting Puppeteer initialization...');

    // 1. 获取当前文件目录
    // const __dirname = path.dirname(new URL(import.meta.url).pathname);
    console.log('🔍 __dirname:', __dirname);

    // 2. 尝试获取 Puppeteer 默认路径
    let executablePath = puppeteer.executablePath();
    console.log('🔍 Default Puppeteer executablePath:', executablePath);
    console.log('✅ Default path exists?', fs.existsSync(executablePath));

    // 3. 手动构建 .local-chromium 路径（假设下载到项目根）
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    console.log('🔍 Project root (3x ..):', projectRoot);

    const localChromiumPath = path.join(
      projectRoot,
      '.local-chromium',
      'chrome',
      'linux-142.0.7444.175',
      'chrome',
    );
    console.log('🔍 Manual .local-chromium path:', localChromiumPath);
    console.log('✅ Manual path exists?', fs.existsSync(localChromiumPath));

    // 4. 查看 .local-chromium 是否存在（检查父目录）
    const localChromiumDir = path.join(projectRoot, '.local-chromium');
    console.log('🔍 .local-chromium directory:', localChromiumDir);
    console.log(
      '✅ .local-chromium dir exists?',
      fs.existsSync(localChromiumDir),
    );

    if (fs.existsSync(localChromiumDir)) {
      console.log('📁 Listing contents of .local-chromium:');
      try {
        const files = fs.readdirSync(localChromiumDir);
        console.log('📂 Files:', files.join(', '));
      } catch (err) {
        console.error('❌ Failed to read .local-chromium:', err.message);
      }
    }

    // 5. 如果默认路径不存在，尝试用手动路径
    if (!fs.existsSync(executablePath)) {
      console.log('⚠️  Default path not found, trying manual path...');
      executablePath = localChromiumPath;
    }

    // 6. 最终确认路径是否存在
    console.log('🎯 Final executablePath:', executablePath);
    console.log('✅ Final path exists?', fs.existsSync(executablePath));

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
