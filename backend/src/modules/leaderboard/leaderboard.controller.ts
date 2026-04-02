import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service.js';

@ApiTags('排行榜')
@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('level')
  @ApiOperation({ summary: '等级排行榜' })
  async getByLevel(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getByLevel({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('posts')
  @ApiOperation({ summary: '发帖排行榜' })
  async getByPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getByPosts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('likes')
  @ApiOperation({ summary: '获赞排行榜' })
  async getByLikes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getByLikes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('comments')
  @ApiOperation({ summary: '评论排行榜' })
  async getByComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getByComments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
