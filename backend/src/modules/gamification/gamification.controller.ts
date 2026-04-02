import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('等级与经验值')
@Controller('api/gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('levels')
  @ApiOperation({ summary: '获取所有等级配置' })
  async getAllLevels() {
    return this.gamificationService.getAllLevelConfigs();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的等级信息' })
  async getMyLevel(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserLevel(userId);
  }

  @Get('me/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的经验值日志' })
  async getMyLogs(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;

    const [data, total] = await Promise.all([
      this.gamificationService['prisma'].experienceLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.gamificationService['prisma'].experienceLog.count({
        where: { userId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  @Post('levels/seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: '初始化等级配置（管理员）' })
  async seedLevels() {
    return this.gamificationService.seedLevelConfigs();
  }
}
