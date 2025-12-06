import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JudgeAnswerDto {
  @ApiProperty({ description: '题目 ID，对应 examQuestion.id' })
  @IsInt()
  questionId: number;

  @ApiProperty({
    description: '用户提交的答案，可为字符串、数组、布尔值或代码对象',
    example:
      'A 或 ["A","C"] 或 true 或 { language: "js", code: "function foo() {}" }',
  })
  @IsNotEmpty()
  userAnswer: any;
}

export class JudgeExamDto {
  @ApiProperty({ description: '考试 ID（可选），用于标识试卷' })
  @IsInt()
  examId: number;

  @ApiProperty({
    description: '用户提交的所有题目答案',
    type: [JudgeAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JudgeAnswerDto)
  answers: JudgeAnswerDto[];
}
