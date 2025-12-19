// src/notification/dto/mark-as-read.dto.ts
import { IsArray, IsInt } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
