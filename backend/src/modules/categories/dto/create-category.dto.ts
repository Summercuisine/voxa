import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '技术分享' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name!: string;

  @ApiProperty({ description: '分类 slug', example: 'tech-sharing' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 60)
  slug!: string;

  @ApiPropertyOptional({ description: '分类描述', example: '分享技术文章和经验' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;

  @ApiPropertyOptional({ description: '分类图标', example: 'code' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  icon?: string;
}
