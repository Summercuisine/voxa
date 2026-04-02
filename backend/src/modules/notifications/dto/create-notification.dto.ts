import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: '通知类型',
    enum: ['COMMENT_REPLY', 'POST_LIKE', 'COMMENT_LIKE', 'NEW_MESSAGE', 'SYSTEM'],
  })
  @IsString()
  @IsIn(['COMMENT_REPLY', 'POST_LIKE', 'COMMENT_LIKE', 'NEW_MESSAGE', 'SYSTEM'])
  type: string;

  @ApiProperty({ description: '通知标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '通知链接' })
  @IsOptional()
  @IsString()
  link?: string;
}
