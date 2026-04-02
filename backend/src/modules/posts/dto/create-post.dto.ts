import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ description: '帖子标题', example: '我的第一篇帖子' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ description: '帖子内容', example: '这是帖子内容...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: '分类ID', example: 'clxxx...' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: '标签列表',
    example: ['NestJS', 'TypeScript'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[];
}
