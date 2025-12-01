// src/certificate/certificate.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { GetCertificateDto } from './dto/get-certificate.dto';

@Injectable()
export class CertificateService {
  constructor(private prisma: PrismaService) {}

  // certificate.service.ts
  async create(createDto: CreateCertificateDto, currentUserId: number) {
    // 可选：校验当前用户是否有权操作（比如只能给自己发证）
    // if (createDto.username !== currentUsername) throw ...

    const existing = await this.prisma.certificate.findFirst({
      where: {
        username: createDto.username,
        courseId: createDto.courseId,
      },
    });

    if (existing) {
      throw new BadRequestException('证书已存在');
    }

    return this.prisma.certificate.create({
      data: {
        username: createDto.username,
        courseId: createDto.courseId,
        templateId: createDto.templateId,
        userId: currentUserId, // ✅ 动态传入，不是写死！
      },
    });
  }

  async findAll(query: GetCertificateDto) {
    const { page = 1, pageSize = 10, ...filters } = query; // 获取分页参数，默认值为第1页，每页10条记录

    const where: any = {};

    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.search) {
      where.OR = [
        {
          name: { contains: filters.search, mode: 'insensitive' },
          mode: 'insensitive',
        },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 计算跳过的记录数
    const skip = (page - 1) * pageSize;

    // 获取总记录数
    const total = await this.prisma.certificate.count({ where });

    // 查询数据
    const certificates = await this.prisma.certificate.findMany({
      where,
      include: {
        user: true,
        course: true,
      },
      skip,
      take: Number(pageSize),
      orderBy: {
        id: 'desc', // 根据需要调整排序规则
      },
    });

    // 将用户信息展开到上层
    const transformedCertificates = certificates.map((cert) => ({
      ...cert,
      name: cert.user ? cert.user.name : null, // 假设用户表中有name字段
      userEmail: cert.user ? cert.user.email : null, // 假设用户表中有email字段
      role: cert.user ? cert.user.role : null,
      courseName: cert.course ? cert.course.title : null, // ✅ 新增：课程名称
      // 可以添加更多用户信息...
    }));

    return {
      list: transformedCertificates,
      pagination: {
        page: Number(page),
        perPage: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });

    if (!cert) {
      throw new NotFoundException(`证书 #${id} 不存在`);
    }

    return cert;
  }

  async update(id: number, updateDto: UpdateCertificateDto) {
    const cert = await this.findOne(id);
    return this.prisma.certificate.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    const cert = await this.findOne(id);
    await this.prisma.certificate.delete({
      where: { id },
    });

    return { message: `证书 #${id} 已删除` };
  }
}
