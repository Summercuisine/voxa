import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryPostDto } from './dto/query-post.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('管理后台')
@ApiBearerAuth()
@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: '仪表盘统计' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: '用户列表' })
  getUsers(@Query() query: QueryUserDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新用户' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除用户' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('posts')
  @Roles('ADMIN')
  @ApiOperation({ summary: '帖子列表' })
  getPosts(@Query() query: QueryPostDto) {
    return this.adminService.getPosts(query);
  }

  @Delete('posts/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除帖子' })
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Get('bot-stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bot 统计' })
  getBotStats() {
    return this.adminService.getBotStats();
  }
}
