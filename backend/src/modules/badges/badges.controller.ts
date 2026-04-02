import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgesService } from './badges.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AwardBadgeDto {
  @ApiProperty({ description: '用户ID', example: 'clxxx...' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

@ApiTags('徽章')
@Controller('api/badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有徽章定义' })
  async findAll() {
    return this.badgesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的徽章' })
  async getMyBadges(@CurrentUser('id') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: '初始化预设徽章（管理员）' })
  async seedBadges() {
    return this.badgesService.seedBadges();
  }

  @Post(':slug/award')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: '手动颁发徽章（管理员）' })
  async awardBadge(
    @Param('slug') slug: string,
    @Body() dto: AwardBadgeDto,
  ) {
    return this.badgesService.awardBadge(dto.userId, slug);
  }
}
