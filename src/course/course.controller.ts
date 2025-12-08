import { success } from './../common/dto/response.dto';
// src/course/course.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ValidationPipe,
  Req,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCourseDto } from './dto/get-course.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { AuthGuard } from '@nestjs/passport';
import { LessonDetailDto } from './dto/lesson-detail.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createDto: CreateCourseDto) {
    const res = this.courseService.create(createDto);
    return success(res);
  }

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: GetCourseDto,
  ) {
    const res = await this.courseService.findAll(query); // ✅ query.page 是 number！
    return success(res);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.courseService.findOne(+id);
  // }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateCourseDto) {
    const res = await this.courseService.update(+id, updateDto);
    return success(res);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const res = this.courseService.remove(+id);
    return success({ success: true, message: 'Delete Success' });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程详情（含课时进度）' })
  @ApiParam({
    name: 'id',
    type: Number, // 👈 告诉 Swagger 这是数字
    description: '课程 ID',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回课程详情',
    schema: {
      example: {
        id: 1,
        title: 'HTML 入门',
        lessons: [{ id: 1, title: '简介', completed: true }],
      },
    },
  })
  async getCourseDetail(@Param('id') id: string, @Req() req: Request) {
    const courseId = parseInt(id, 10);
    const userId = (req as any).user.id; // 从 JWT 获取
    const res = await this.courseService.getCourseDetail(courseId, userId);
    return success(res);
  }

  @Post(':courseId/lessons')
  async createLesson(
    @Param('courseId') courseId: number,
    @Body() dto: CreateLessonDto,
  ) {
    const res = await this.courseService.createLesson(courseId, dto);
    return success(res);
  }

  @Patch('lessons/:lessonId')
  async updateLesson(
    @Param('lessonId') lessonId: number,
    @Body() dto: UpdateLessonDto,
  ) {
    const res = await this.courseService.updateLesson(lessonId, dto);
    return success({ success: true, message: 'Add success' });
  }

  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: number) {
    const res = await this.courseService.deleteLesson(lessonId);
    return success({ success: true, message: 'Delete success' });
  }

  @Post(':courseId/reorder-lessons')
  async reorderLessons(
    @Param('courseId') courseId: number,
    @Body() reorderLessonsDto: ReorderLessonsDto,
    @Req() req,
  ) {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const res = await this.courseService.reorderLessons(
      courseId,
      reorderLessonsDto.lessonIds,
      currentUserId,
      currentUserRole,
    );
    return success(res);
  }

  // course.controller.ts
  @Post(':courseId/lessons/:lessonId/complete')
  async completeLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    const res = await this.courseService.completeLesson(userId, lessonId);
    return success(res);
  }

  // course.controller.ts
  @Post(':courseId/lessons/:lessonId/uncomplete')
  @UseGuards(AuthGuard('jwt'))
  async uncompleteLesson(
    @Param('courseId') courseId: number,
    @Param('lessonId') lessonId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    // ✅ 校验归属关系
    await this.courseService.validateLessonBelongsToCourse(lessonId, courseId);
    // ✅ 调用 Service 方法（安全）
    const res = await this.courseService.uncompleteLesson(userId, lessonId);
    return success(res);
  }

  @Get(':courseId/progress')
  async getProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    const res = await this.courseService.getUserCourseProgress(
      courseId,
      userId,
    );
    return success(res);
  }

  // 👇 新增接口：GET /course/lessons/:lessonId
  @Get('lessons/:lessonId')
  async getLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Req() req,
  ) {
    const userId = req.user?.id; // 假设你有 JWT 认证，user 存在 req 上
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    const res = await this.courseService.getLessonById(lessonId, userId);
    return success(res);
  }
}
