import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../../generated/prisma/client.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role, description: '用户角色' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
