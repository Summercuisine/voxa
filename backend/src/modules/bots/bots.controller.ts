import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BotsService } from './bots.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Bot 管理')
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  @ApiOperation({ summary: '获取 Bot 列表（公开）' })
  findAll() {
    return this.botsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取 Bot 详情（公开）' })
  findOne(@Param('id') id: string) {
    return this.botsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建 Bot（需 ADMIN）' })
  create(@Body() body: any) {
    return this.botsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新 Bot（需 ADMIN）' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.botsService.update(id, body);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用/禁用 Bot（需 ADMIN）' })
  toggleActive(@Param('id') id: string) {
    return this.botsService.toggleActive(id);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取 Bot 操作日志（需 ADMIN）' })
  getBotLogs(
    @Param('id') id: string,
    @Query() query: { page?: string; limit?: string; action?: string },
  ) {
    return this.botsService.getBotLogs(id, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      action: query.action,
    });
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '初始化预设 Bot（需 ADMIN）' })
  seedBots() {
    return this.botsService.seedBots();
  }
}
