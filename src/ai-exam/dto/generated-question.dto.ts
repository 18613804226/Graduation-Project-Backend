import { ApiProperty } from '@nestjs/swagger';

export class GeneratedQuestion {
  @ApiProperty()
  id: number;

  @ApiProperty({
    description: '题型，如 single、multiple、true_false、essay、coding',
  })
  type: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ required: false, type: [String] })
  options?: string[];

  @ApiProperty()
  answer: string;

  @ApiProperty()
  explanation: string;

  @ApiProperty()
  sectionId: number;

  @ApiProperty({ required: false })
  score?: number;
}
