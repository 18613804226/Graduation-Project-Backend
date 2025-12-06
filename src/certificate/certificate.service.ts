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
      throw new BadRequestException('The certificate already exists.');
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

  // src/certificate/certificate.service.ts

  async findAll(
    query: GetCertificateDto,
    currentUser: { id: number; role: string }, // 👈 注意：Prisma 的 id 是 Int，所以用 number
  ) {
    const { page = 1, pageSize = 10, ...filters } = query;
    let where: any = {};

    // 🔐 权限控制：学生只能看自己的证书
    if (['USER', 'STUDENT'].includes(currentUser.role)) {
      where.userId = currentUser.id;
    }
    // admin / teacher 不加限制 → 可查全部

    // 其他过滤条件（保持原有逻辑）
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
        { name: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const total = await this.prisma.certificate.count({ where });
    const certificates = await this.prisma.certificate.findMany({
      where,
      include: {
        user: true,
        course: true,
      },
      skip,
      take: Number(pageSize),
      orderBy: { id: 'desc' },
    });

    const transformedCertificates = certificates.map((cert) => ({
      ...cert,
      name: cert.user?.name || null,
      userEmail: cert.user?.email || null,
      role: cert.user?.role || null,
      courseName: cert.course?.title || null,
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
