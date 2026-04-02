import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('点赞与收藏')
@Controller()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('api/posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换帖子点赞' })
  toggleLike(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.toggleLike(userId, postId);
  }

  @Post('api/comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换评论点赞' })
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.toggleCommentLike(userId, commentId);
  }

  @Post('api/posts/:postId/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换帖子收藏' })
  toggleBookmark(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.toggleBookmark(userId, postId);
  }

  @Get('api/posts/:postId/likes')
  @ApiOperation({ summary: '获取帖子点赞用户列表' })
  getLikes(@Param('postId') postId: string) {
    return this.likesService.getLikes(postId);
  }

  @Get('api/users/me/bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的收藏列表' })
  getBookmarks(@CurrentUser('id') userId: string) {
    return this.likesService.getBookmarks(userId);
  }

  @Get('api/posts/:postId/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查点赞/收藏状态' })
  async getLikeStatus(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const [liked, bookmarked] = await Promise.all([
      this.likesService.isLiked(userId, postId),
      this.likesService.isBookmarked(userId, postId),
    ]);
    return { liked, bookmarked };
  }
}
