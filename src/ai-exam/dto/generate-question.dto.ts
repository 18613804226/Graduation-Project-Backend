import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GenerateQuestionDto {
  @ApiProperty({ description: '模板 ID，对应 ExamTemplate.id' })
  @IsInt()
  templateId: number;

  @ApiProperty({
    description: '题目难度（可选），如 Simple、medium、difficulty',
    required: false,
  })
  @IsOptional()
  @IsString()
  difficulty?: string;
}
