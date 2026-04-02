import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'john_doe', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ description: '邮箱地址', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
