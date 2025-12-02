// src/common/pdf/pdf.service.ts
import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PdfService implements OnModuleInit {
  private useRedis = false;
  private memoryCache = new Map<string, { value: Buffer; expiresAt: number }>();
  private sealBase64: string;

  constructor(@Optional() private readonly redisService?: RedisService) {}

  async onModuleInit() {
    // 加载 seal.png（如果存在）
    const sealPath = path.join(process.cwd(), 'src', 'assets', 'seal.png');
    if (fs.existsSync(sealPath)) {
      this.sealBase64 = fs.readFileSync(sealPath, 'base64');
      console.log('🟢 Seal image loaded');
    } else {
      console.warn('🟠 Seal image not found at:', sealPath);
    }

    // 检测 Redis
    if (this.redisService) {
      try {
        await this.redisService.set('pdf_ping', Buffer.from('ok'), 5);
        const pong = await this.redisService.get('pdf_ping');
        if (pong && pong.toString('utf8') === 'ok') {
          this.useRedis = true;
          console.log('🟢 PDF cache: Redis available');
        }
      } catch (e) {
        console.warn('🟠 PDF cache: Redis not available, using memory');
      }
    } else {
      console.log('🟡 PDF cache: RedisService not provided, using memory only');
    }
    // ✅ 预热 pdfmake 引擎（关键优化！）
    console.log('🔥 Warming up pdfmake engine...');
    try {
      const dummyDoc = pdfMake.createPdf({
        content: ['Warm-up'],
        defaultStyle: { font: 'Roboto' },
      });
      await new Promise<void>((resolve) => {
        dummyDoc.getBuffer(() => resolve());
      });
      console.log('✅ pdfmake engine warmed up');
    } catch (e) {
      console.error('❌ pdfmake warm-up failed', e);
    }
  }

  private generateCacheKey(templateName: string, data: any): string {
    return (
      'pdf:' +
      createHash('md5')
        .update(`${templateName}:${JSON.stringify(data)}`)
        .digest('hex')
    );
  }

  private async getFromCache(key: string): Promise<Buffer | null> {
    if (this.useRedis && this.redisService) {
      return await this.redisService.get(key);
    }
    const item = this.memoryCache.get(key);
    if (item && Date.now() < item.expiresAt) {
      return item.value;
    }
    this.memoryCache.delete(key);
    return null;
  }

  private async setToCache(
    key: string,
    buffer: Buffer,
    ttlSeconds: number,
  ): Promise<void> {
    if (this.useRedis && this.redisService) {
      await this.redisService.set(key, buffer, ttlSeconds);
      return;
    }
    this.memoryCache.set(key, {
      value: buffer,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    if (this.memoryCache.size > 50) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }

  async generateCertificatePdf(data: any): Promise<Buffer> {
    return this.generateFromTemplate('certificate', data);
  }

  async generateFromTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<Buffer> {
    const cacheKey = this.generateCacheKey(templateName, data);

    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`✅ PDF cache hit: ${cacheKey}`);
      return Buffer.from(cached);
    }

    console.log(`🔄 Generating PDF for ${templateName}`);
    const docDefinition = this.buildTemplate(templateName, data);
    const pdfBuffer = await this.renderPdf(docDefinition);

    await this.setToCache(cacheKey, pdfBuffer, 3600);
    return pdfBuffer;
  }

  private buildTemplate(templateName: string, data: any) {
    if (templateName !== 'certificate') {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const pageWidth = 595.28; // A4 width in pt
    const pageHeight = 841.89; // A4 height in pt

    // ✅ 水印：用 text + rotation + width 防止换行
    const watermark = {
      text: 'Training Center',
      fontSize: 60,
      color: '#e0e0e0',
      opacity: 0.2,
      angle: -45, // 斜着显示
      absolutePosition: { x: pageWidth / 2 - 200, y: pageHeight / 2 },
      width: 200, // 限制宽度，防止自动换行
      // alignment: 'center',
    };

    const content = [
      // 正文内容
      { text: 'Certificate of Completion', style: 'title' },
      { text: 'This is to certify that', style: 'intro' },
      { text: data.username || 'Anonymous', style: 'name' },
      {
        text: [
          'has successfully completed the course\n\n < ',
          { text: data.courseName || 'Course Name', bold: true },
          ' > \n\nThis certificate is awarded in recognition of their dedication and achievement.',
        ],
        style: 'statement',
      },
      {
        stack: [
          'Issuing Authority: Training Center',
          `Date of Issuance: ${new Date(data.issuedAt || Date.now()).toLocaleDateString('zh-CN')}`,
        ],
        style: 'footer',
      },
    ];

    const docDef = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      watermark,
      content,
      styles: {
        title: { fontSize: 32, alignment: 'center', margin: [0, 40, 0, 20] },
        intro: { fontSize: 18, alignment: 'center', margin: [0, 0, 0, 15] },
        name: {
          fontSize: 26,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 25],
        },
        statement: {
          fontSize: 16,
          lineHeight: 1.5,
          alignment: 'center',
          margin: [0, 0, 0, 50],
          width: 400,
        },
        footer: { fontSize: 14, alignment: 'right', margin: [0, 60, 0, 0] },
      },
      pageMargins: [85, 113, 85, 113],
    };

    // 添加印章（与签名对齐）
    if (this.sealBase64) {
      (docDef as any).images = {
        seal: `data:image/png;base64,${this.sealBase64}`,
      };
      (docDef as any).content.push({
        image: 'seal',
        width: 90,
        height: 90,
        absolutePosition: {
          x: pageWidth / 2 + 70, // 居中
          y: pageHeight - 310, // 距离底部 150pt（约 5.3cm），与签发信息对齐
        },
      });
    }

    return docDef;
  }

  private renderPdf(docDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const vfs = {
        ...pdfFonts.vfs,
      };

      const pdfDoc = pdfMake.createPdf(docDefinition); // 注意：第二个参数是 fonts，第三个是 vfs

      pdfDoc.getBuffer((buffer) => {
        if (buffer) resolve(buffer);
        else reject(new Error('PDF generation failed'));
      });
    });
  }
}
