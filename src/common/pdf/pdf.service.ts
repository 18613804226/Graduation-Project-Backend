// src/common/pdf/pdf.service.ts
import { Injectable } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PdfService {
  private static browser: Browser;

  constructor(private redisService: RedisService) {}

  private async getBrowser(): Promise<Browser> {
    if (!PdfService.browser) {
      PdfService.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return PdfService.browser;
  }

  private generateCacheKey(html: string, options?: PdfOptions): string {
    const keyData = html + JSON.stringify(options || {});
    return 'pdf:' + createHash('md5').update(keyData).digest('hex');
  }

  async htmlToPdf(html: string, options?: PdfOptions): Promise<Buffer> {
    const cacheKey = this.generateCacheKey(html, options);

    // 🔍 从 Redis 获取
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`✅ Redis cache hit: ${cacheKey}`);
      return cached;
    }

    // 🖨️ 生成新 PDF
    console.log(`🔄 Generating PDF: ${cacheKey}`);
    const pdf = await this.renderHtmlToPdf(html, options);

    // 💾 缓存 1 小时
    await this.redisService.set(cacheKey, pdf, 3600);

    return pdf;
  }

  private async renderHtmlToPdf(
    html: string,
    options?: PdfOptions,
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle', timeout: 10000 });
      return await page.pdf({
        format: options?.format || 'A4',
        printBackground: true,
        margin: { top: '0cm', bottom: '0cm', left: '0cm', right: '0cm' },
      });
    } finally {
      await page.close();
    }
  }
}

export type PdfOptions = {
  format?: 'A4' | 'Letter';
};
