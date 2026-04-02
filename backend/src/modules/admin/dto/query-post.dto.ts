import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryPostDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '搜索标题或内容' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '按状态筛选', enum: ['all', 'pinned', 'locked'] })
  @IsOptional()
  @IsIn(['all', 'pinned', 'locked'])
  status?: 'all' | 'pinned' | 'locked';
}
