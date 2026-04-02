import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: '对方用户 ID', example: 'clxxx...' })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
