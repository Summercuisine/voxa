import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '邮箱地址', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(1)
  password: string;
}
