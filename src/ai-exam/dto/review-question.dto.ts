import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { GeneratedQuestion } from './generated-question.dto';

export class ReviewQuestionDto {
  @ApiProperty({ type: [GeneratedQuestion] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedQuestion)
  questions: GeneratedQuestion[];
}
