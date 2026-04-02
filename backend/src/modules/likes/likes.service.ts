import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { GamificationService } from '../gamification/gamification.service.js';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: { userId, postId },
    });

    // 点赞成功后给帖子作者加经验
    if (post.authorId !== userId) {
      await this.gamificationService.addExperience(
        post.authorId,
        2,
        'LIKE_RECEIVED',
        '帖子被赞',
      );
    }

    return { liked: true };
  }

  async toggleCommentLike(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: { userId, commentId },
    });
    return { liked: true };
  }

  async toggleBookmark(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: { userId_postId: { userId, postId } },
      });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({
      data: { userId, postId },
    });
    return { bookmarked: true };
  }

  async getLikes(postId: string) {
    const likes = await this.prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes.map((like) => like.user);
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
            category: true,
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map((bookmark) => bookmark.post);
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!like;
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!bookmark;
  }
}
