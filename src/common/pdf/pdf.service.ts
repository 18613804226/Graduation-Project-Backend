// src/common/pdf/pdf.service.ts
import { Injectable } from '@nestjs/common';
import { chromium, Page } from 'playwright-core';

@Injectable()
export class PdfService {
  async htmlToPdf(
    html: string,
    options?: {
      format?: 'A4' | 'Letter';
      printBackground?: boolean;
    },
  ): Promise<Buffer> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 设置 HTML 内容
    await page.setContent(html, {
      waitUntil: 'networkidle', // 等待网络空闲（可选）
      timeout: 10000,
    });

    // 生成 PDF
    const pdf = await page.pdf({
      format: options?.format || 'A4',
      printBackground: options?.printBackground ?? true,
      margin: {
        top: '1cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm',
      },
    });

    await browser.close();
    return pdf;
  }
}
