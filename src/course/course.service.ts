// src/course/course.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCourseDto } from './dto/get-course.dto';
import { CourseDetailDto } from './dto/course-detail.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

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
        description: lesson.description || '',
        completed: lesson.progresses.some((p) => p.completed),
      })),
      examTemplates: course.examTemplates.map(({ id, name, duration }) => ({
        id,
        name,
        duration,
      })),
    };
  }

  async createLesson(courseId: number, dto: CreateLessonDto) {
    // 查询当前课程下最大的 order 值
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    const order = maxOrder._max.order ? maxOrder._max.order + 1 : 1;

    return this.prisma.lesson.create({
      data: {
        ...dto,
        courseId,
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // src/course/course.service.ts
  async updateLesson(lessonId: number, dto: UpdateLessonDto) {
    // 可选：校验 lesson 是否存在
    const existing = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!existing) {
      throw new NotFoundException('Lesson not found');
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  // src/course/course.service.ts
  async deleteLesson(lessonId: number) {
    // 可选：检查是否存在
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // 执行删除
    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });

    return { success: true };
  }

  // ✅ 重排序课时
  // course.service.ts
  async reorderLessons(
    courseId: number,
    lessonIds: number[],
    currentUserId: number,
    currentUserRole: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // 权限校验
    if (course.teacherId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You are not authorized to modify this course',
      );
    }

    // 获取课程总课时数
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId },
    });

    // 必须传入全部课时
    if (lessonIds.length !== totalLessons) {
      throw new BadRequestException(
        `Expected ${totalLessons} lesson IDs, but got ${lessonIds.length}`,
      );
    }

    // 验证所有 lesson 属于该课程且无重复
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        courseId,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      throw new BadRequestException(
        'Some lesson IDs do not belong to this course',
      );
    }

    // 检查是否有重复 ID（防止前端传 [1,1,2]）
    if (new Set(lessonIds).size !== lessonIds.length) {
      throw new BadRequestException('Duplicate lesson IDs are not allowed');
    }

    // 批量更新
    const updates = lessonIds.map((lessonId, index) =>
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: { order: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);

    return { success: true, message: 'Lesson order updated successfully' };
  }

  // 👇 添加到 course.service.ts 末尾
  async completeLesson(userId: number, lessonId: number) {
    // 1. 验证 lesson 是否存在，并属于某个 course（可选）
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // 2. 创建或更新 LessonProgress
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId }, // 复合唯一键
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
    });

    return { success: true, message: 'Lesson marked as completed' };
  }

  async uncompleteLesson(userId: number, lessonId: number) {
    // ✅ 先查 lesson 是否存在且属于某课程（可选）
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    // ✅ 校验是否属于该 course？如果你需要这个校验，可以加
    // 但通常不必要，因为后续操作不会影响其他课程
    // 继续处理进度...
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!progress) {
      return { success: true, message: 'Lesson is already incomplete' };
    }

    await this.prisma.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        completed: false,
        completedAt: null,
      },
    });

    return { success: true, message: 'Lesson marked as incomplete' };
  }
  async validateLessonBelongsToCourse(lessonId: number, courseId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      throw new BadRequestException('Invalid lesson or course');
    }
  }

  async getUserCourseProgress(courseId: number, userId: number) {
    const [course, progressRecords] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { lessons: { select: { id: true } } },
      }),
      this.prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { courseId },
        },
        select: { lessonId: true, completed: true },
      }),
    ]);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = course.lessons.length;
    const completedCount = progressRecords.filter((p) => p.completed).length;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      courseId,
      totalLessons,
      completedLessons: completedCount,
      progressPercentage,
    };
  }

  // src/course/course.service.ts

  async getLessonById(lessonId: number, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            // 可扩展：检查用户是否购买/加入课程（按需）
          },
        },
        progresses: {
          where: { userId },
          select: { completed: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || undefined,
      content: lesson.content || undefined,
      videoUrl: lesson.videoUrl || undefined,
      type: lesson.type || 'text',
      order: lesson.order,
      courseId: lesson.courseId,
      courseTitle: lesson.course.title,
      completed: lesson.progresses.some((p) => p.completed),
      createdAt: lesson.createdAt.toISOString(),
    };
  }
}
