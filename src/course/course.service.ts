// src/course/course.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCourseDto } from './dto/get-course.dto';
import { CourseDetailDto } from './dto/course-detail.dto';

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
    const {
      page,
      pageSize,
      title,
      search,
      teacher,
      category,
      startDate,
      endDate,
    } = query;

    const where: any = {};
    const searchTerm = title || search; // 兼容 title 和 search

    // 🔹 搜索课程标题或描述
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // 🔹 搜索教师姓名（通过 teacher 字段）
    if (teacher) {
      where.teacher = {
        username: { contains: teacher, mode: 'insensitive' },
      };
    }
    // 🔹 搜索分类
    if (category) {
      where.category = { equals: category }; // 精确匹配
      // 如果允许模糊搜索，用：{ contains: category, mode: 'insensitive' }
    }

    // 🔹 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }
    if (page == null || pageSize == null) {
      const data = await this.prisma.course.findMany({
        where,
        include: {
          teacher: { select: { username: true } }, // 只返回 username
        },
      });
      // ✅ 转换 teacher 对象为字符串
      return data.map((course) => ({
        ...course,
        teacher: course.teacher?.username || null,
      }));
    }

    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          teacher: { select: { username: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);
    // ✅ 转换分页数据中的 teacher
    const list = data.map((course) => ({
      ...course,
      teacher: course.teacher?.username || null,
    }));
    return {
      list: list,
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
  // 👇 新增方法：获取课程详情（含课时进度）
  // src/course/course.service.ts

  async getCourseDetail(id: number, userId: number): Promise<CourseDetailDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: true,
        lessons: {
          include: {
            progresses: {
              where: { userId },
              select: { completed: true },
            },
          },
        },
        examTemplates: true,
      },
    });

    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    if (!course.teacher) {
      throw new NotFoundException('课程未绑定教师');
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description || '',
      cover: course.cover || '',
      category: course.category || '',
      createdAt: course.createdAt.toISOString(), // ✅ 转为 ISO 字符串
      teacher: {
        id: course.teacher.id,
        nickname: course.teacher.nickname || '',
        username: course.teacher.username || '',
      },
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        // ✅ 修复：只要有一条 completed=true 就算完成
        completed: lesson.progresses.some((p) => p.completed),
      })),
      examTemplates: course.examTemplates.map(({ id, name, duration }) => ({
        id,
        name,
        duration,
      })),
    };
  }
}
