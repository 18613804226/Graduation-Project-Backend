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
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCourseDto } from './dto/get-course.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCourseDto) {
    return this.courseService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const res = this.courseService.remove(+id);
    return success({ success: true, message: 'Delete Success' });
  }
}
