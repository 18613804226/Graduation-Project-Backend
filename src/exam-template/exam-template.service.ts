import { success } from 'src/common/dto/response.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto';
import { GetExamTemplateDto } from './dto/get-exam-template.dto';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto';
@Injectable()
export class ExamTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateExamTemplateDto) {
    // 🔍 检查是否已存在同名模板
    const existing = await this.prisma.examTemplate.findFirst({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException(`模板名称 "${createDto.name}" 已存在`);
    }

    // ✅ 名称未使用，执行创建
    const template = await this.prisma.examTemplate.create({
      data: {
        name: createDto.name,
        duration: createDto.duration,
        sections: {
          createMany: {
            data: createDto.sections.map((section) => ({
              questionType: section.questionType,
              count: section.count,
              score: section.score,
            })),
          },
        },
      },
    });

    return this.findOne(template.id);
  }

  async findAll() {
    return this.prisma.examTemplate.findMany({
      include: {
        sections: true,
      },
    });
  }

  async findOne(id: number): Promise<GetExamTemplateDto> {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id },
      include: {
        sections: true,
      },
    });

    if (!template) throw new NotFoundException(`模板 ID ${id} 不存在`);

    return {
      id: template.id,
      name: template.name,
      duration: template.duration,
      sections: template.sections,
    };
  }

  async update(id: number, updateDto: UpdateExamTemplateDto) {
    // 先删除旧的 sections
    await this.prisma.examSection.deleteMany({
      where: { templateId: id },
    });

    // 再创建新的 sections
    const updatedTemplate = await this.prisma.examTemplate.update({
      where: { id },
      data: {
        name: updateDto.name,
        duration: updateDto.duration,
        sections: {
          createMany: {
            data:
              updateDto.sections?.map((section) => ({
                questionType: section.questionType,
                count: section.count,
                score: section.score,
              })) || [],
          },
        },
      },
    });

    return this.findOne(updatedTemplate.id);
  }

  async remove(id: number) {
    await this.prisma.examTemplate.delete({
      where: { id },
    });
  }
}
