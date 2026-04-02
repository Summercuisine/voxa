import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '按分类筛选', example: 'clxxx...' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '按标签筛选', example: 'NestJS' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: '排序方式',
    enum: ['latest', 'popular', 'pinned'],
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'popular', 'pinned'])
  sort?: 'latest' | 'popular' | 'pinned' = 'latest';

  @ApiPropertyOptional({ description: '搜索关键词', example: 'NestJS' })
  @IsOptional()
  @IsString()
  search?: string;
}
