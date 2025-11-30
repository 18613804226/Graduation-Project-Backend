// src/course/course.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCourseDto } from './dto/get-course.dto';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCourseDto) {
    return this.prisma.course.create({
      data: createDto,
      include: { teacher: { select: { id: true, username: true } } },
    });
  }

  async findAll(query: GetCourseDto) {
    const { page, pageSize, name, search } = query;

    const where: any = {};
    if (name) where.name = name;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 🔑 关键逻辑：如果没传 page 或 pageSize，就查全部
    if (page == null || pageSize == null) {
      // 查询全部，不分页
      const data = await this.prisma.course.findMany({
        where,
        include: { teacher: { select: { id: true, username: true } } },
      });
      return data; // 直接返回数组
    }

    // 否则走分页逻辑
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        include: { teacher: { select: { id: true, username: true } } },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { teacher: { select: { id: true, username: true } } },
    });
    if (!course) throw new NotFoundException(`课程 #${id} 不存在`);
    return course;
  }

  async update(id: number, updateDto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: updateDto,
      include: { teacher: { select: { id: true, username: true } } },
    });
  }

  async remove(id: number) {
    return this.prisma.course.delete({ where: { id } });
  }
}
