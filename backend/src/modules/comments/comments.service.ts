import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { QueryCommentDto } from './dto/query-comment.dto.js';
import { GamificationService } from '../gamification/gamification.service.js';

const MAX_COMMENT_DEPTH = 3;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  private async getCommentDepth(commentId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = commentId;

    while (currentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (!comment) break;
      depth++;
      currentId = comment.parentId;
    }

    return depth;
  }

  async create(userId: string, postId: string, dto: CreateCommentDto) {
    // 并行查询帖子和父评论
    const [post, parentComment] = await Promise.all([
      this.prisma.post.findUnique({ where: { id: postId } }),
      dto.parentId
        ? this.prisma.comment.findUnique({
            where: { id: dto.parentId },
          })
        : null,
    ]);

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.isLocked) {
      throw new BadRequestException('帖子已被锁定，无法评论');
    }

    if (dto.parentId) {
      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException('父评论不属于该帖子');
      }

      // 检查嵌套深度限制
      const depth = await this.getCommentDepth(dto.parentId);
      if (depth >= MAX_COMMENT_DEPTH) {
        throw new BadRequestException(
          `评论嵌套深度不能超过 ${MAX_COMMENT_DEPTH} 层`,
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId: userId,
        postId,
        parentId: dto.parentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // 评论经验
    await this.gamificationService.addExperience(
      userId,
      3,
      'COMMENT_CREATED',
      '发表评论',
    );

    return comment;
  }

  async findAll(postId: string, query: QueryCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      }),
      this.prisma.comment.count({
        where: { postId, parentId: null },
      }),
    ]);

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('只能更新自己的评论');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: { select: { role: true } } },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId && comment.author.role !== 'ADMIN') {
      throw new ForbiddenException('只能删除自己的评论或管理员才能删除');
    }

    await this.prisma.comment.delete({ where: { id } });

    return { message: '评论已删除' };
  }
}
