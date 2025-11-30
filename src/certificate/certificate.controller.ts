// src/certificate/certificate.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { GetCertificateDto } from './dto/get-certificate.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { success } from 'src/common/dto/response.dto';
import { AuthGuard } from '@nestjs/passport';
import { join } from 'path';
// const fontPath = join(__dirname, '../assets/fonts/NotoSansSC-Regular.ttf');
import * as puppeteer from 'puppeteer';
import { readFileToBase64 } from '../utils/file.util';
import { readFile } from 'fs/promises';
import { PuppeteerService } from '../common/puppeteer/puppeteer.service';

@ApiTags('证书')
@UseGuards(AuthGuard('jwt'))
@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly certificateService: CertificateService,
    private readonly puppeteerService: PuppeteerService,
  ) {}

  // certificate.controller.ts
  @Post()
  async create(@Body('params') params: any, @Req() req) {
    const { username, courseId, templateId } = params;
    if (!username || !courseId || !templateId) {
      throw new BadRequestException('缺少必要参数');
    }

    const res = await this.certificateService.create(
      {
        username,
        courseId: courseId,
        templateId: templateId,
      },
      req.user.id,
    );
    return success(res);
  }

  @Get()
  @ApiOperation({ summary: '查询证书列表' })
  @ApiResponse({ status: 200, description: '返回证书列表' })
  async findAll(@Query() query: GetCertificateDto) {
    const res = await this.certificateService.findAll(query);
    return success(res);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个证书' })
  @ApiResponse({ status: 200, description: '返回证书详情' })
  async findOne(@Param('id') id: number) {
    return await this.certificateService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新证书' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateCertificateDto,
  ) {
    return await this.certificateService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除证书' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.certificateService.remove(id);
    return success({ success: true, message: 'Delete Success' });
  }
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      // 获取证书数据
      const cert = await this.certificateService.findOne(id);

      // 读取 HTML 模板（注意路径：现在模板放在 src/assets/templates/）
      let html = (
        await readFile(join(__dirname, '../assets/templates/certificate.html'))
      ).toString();

      // 读取印章 Base64
      const sealBase64 = await readFileToBase64(
        join(__dirname, '../assets/seal.png'),
      );

      // 替换模板变量
      html = html
        .replace('{{USERNAME}}', cert.username)
        .replace('{{COURSE_NAME}}', cert.course.name)
        .replace('{{ISSUED_DATE}}', cert.issuedAt.toLocaleDateString('zh-CN'))
        .replace('{{SEAL_BASE64}}', sealBase64)
        .replace('{{FONT_BASE64}}', ''); // 不内嵌字体

      // ✅ 复用已启动的浏览器（关键优化！）
      const browser = this.puppeteerService.getBrowser();
      const page = await browser.newPage();

      // 设置内容并生成 PDF
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      // ✅ 只关闭页面，不关闭浏览器！
      await page.close();

      // 返回 PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="certificate-${id}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      if (error instanceof NotFoundException) {
        res.status(404).send('证书不存在');
      } else {
        res.status(500).send('证书生成失败');
      }
    }
  }
}
