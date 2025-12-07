import { success } from './../common/dto/response.dto';
// src/course/course.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ValidationPipe,
  Req,
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
}
