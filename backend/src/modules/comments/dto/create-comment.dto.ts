import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容', example: '写得很好！' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  content!: string;

  @ApiPropertyOptional({ description: '父评论ID（回复评论时使用）', example: 'clxxx...' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
