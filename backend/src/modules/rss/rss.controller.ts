import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RssService } from './rss.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('RSS 抓取')
@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get('sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取 RSS 源列表（需 ADMIN）' })
  getSources() {
    return this.rssService.fetchAllSources();
  }

  @Post('sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加 RSS 源（需 ADMIN）' })
  addSource(@Body() body: any) {
    return this.rssService.addSource(body);
  }

  @Delete('sources/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除 RSS 源（需 ADMIN）' })
  removeSource(@Param('id') id: string) {
    return this.rssService.removeSource(id);
  }

  @Post('fetch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '手动触发抓取（需 ADMIN）' })
  async fetchAll() {
    return this.rssService.fetchAllSources();
  }
}
