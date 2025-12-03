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
// import * as puppeteer from 'puppeteer-core';
// import { readFileToBase64 } from '../utils/file.util';
// import { readFile } from 'fs/promises';
import { PdfService } from 'src/common/pdf/pdf.service';
import { PrismaService } from 'prisma/prisma.service';
@ApiTags('证书')
@UseGuards(AuthGuard('jwt'))
@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly certificateService: CertificateService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService, // 👈 新增
  ) {}
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
  async findAll(@Query() query: GetCertificateDto, @Req() req) {
    const res = await this.certificateService.findAll(query, req.user);
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

  // @Get(':id/pdf')
  // async downloadPdf(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const cert = await this.certificateService.findOne(id);

  //     // ✅ 直接传结构化数据，不再拼 HTML
  //     const pdfBuffer = await this.pdfService.generateCertificatePdf({
  //       username: cert.username,
  //       courseName: cert.course?.title || '未命名课程',
  //       issuedAt: cert.issuedAt,
  //       certificateId: String(cert.id).padStart(6, '0'),
  //       // 如果需要印章，可以传路径或 base64（见下方说明）
  //     });

  //     res.setHeader('Content-Type', 'application/pdf');
  //     res.setHeader(
  //       'Content-Disposition',
  //       `inline; filename="certificate-${id}.pdf"`,
  //     );
  //     res.end(pdfBuffer); // 注意：用 .end() 而不是 .send()（因为是 Buffer）
  //   } catch (error) {
  //     console.error('PDF Generation Error:', error);
  //     if (error instanceof NotFoundException) {
  //       res.status(404).send('证书不存在');
  //     } else {
  //       res.status(500).send('证书生成失败');
  //     }
  //   }
  // }

  @Get(':id/pdf/preview')
  @ApiOperation({ summary: '预览证书 PDF（不记录下载）' })
  async previewPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const cert = await this.certificateService.findOne(id);
      const pdfBuffer = await this.pdfService.generateCertificatePdf({
        username: cert.username,
        courseName: cert.course?.title || '未命名课程',
        issuedAt: cert.issuedAt,
        certificateId: String(cert.id).padStart(6, '0'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline'); // 预览
      res.end(pdfBuffer);
    } catch (error) {
      console.error('PDF Preview Error:', error);
      if (error instanceof NotFoundException) {
        res.status(404).send('证书不存在');
      } else {
        res.status(500).send('证书生成失败');
      }
    }
  }
  @Get(':id/pdf/download')
  @ApiOperation({ summary: '下载证书 PDF（记录下载量）' })
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      // ✅ 确保用户已认证（虽然有全局 Guard，但显式检查更安全）
      if (!req.user?.id) {
        return res.status(401).send('请先登录');
      }

      const cert = await this.certificateService.findOne(id);
      const pdfBuffer = await this.pdfService.generateCertificatePdf({
        username: cert.username,
        courseName: cert.course?.title || '未命名课程',
        issuedAt: cert.issuedAt,
        certificateId: String(cert.id).padStart(6, '0'),
      });

      // ✅【关键】只在 download 接口记录下载行为
      await this.prisma.resourceDownload.create({
        data: {
          userId: req.user.id,
          resourceId: id,
          resourceType: 'certificate',
          fileName: `certificate-${id}.pdf`,
        },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificate-${id}.pdf"`, // ⚠️ attachment 触发下载
      );
      res.end(pdfBuffer);
    } catch (error) {
      console.error('PDF Download Error:', error);
      if (error instanceof NotFoundException) {
        res.status(404).send('证书不存在');
      } else {
        res.status(500).send('证书生成失败');
      }
    }
  }
}
