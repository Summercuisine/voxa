import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('用户')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表（分页）' })
  async findAll(@Query() query: { page?: string; limit?: string }) {
    return this.usersService.findAll(query as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户资料' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.update(id, dto, req.user.id);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: '获取用户的帖子列表' })
  async getProfilePosts(
    @Param('id') id: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.usersService.getProfilePosts(id, query as any);
  }
}
