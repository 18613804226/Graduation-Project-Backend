import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ExamTemplateService } from './exam-template.service';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto';
import { GetExamTemplateDto } from './dto/get-exam-template.dto';
import { success } from 'src/common/dto/response.dto';
import { ApiResponse } from '../common/types/api-response.type';
@Controller('exam-templates')
export class ExamTemplateController {
  constructor(private readonly examTemplateService: ExamTemplateService) {}

  @Post()
  async create(@Body() createDto: CreateExamTemplateDto) {
    const res = await this.examTemplateService.create(createDto);
    return success({ ...res, success: true });
  }

  @Get()
  async findAll(): Promise<ApiResponse<GetExamTemplateDto[]>> {
    const res = await this.examTemplateService.findAll();
    return success(res);
  }
  // ✅ 修复这里：加上 ParseIntPipe
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const res = await this.examTemplateService.findOne(id);
    return success(res);
  }

  // ✅ 修复这里：加上 ParseIntPipe
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExamTemplateDto,
  ) {
    const res = await this.examTemplateService.update(id, updateDto);
    return success({ ...res, success: true });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const res = await this.examTemplateService.remove(id);
    return success({ success: true });
  }
}
