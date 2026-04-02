import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, postId: string, dto: CreateCommentDto) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查帖子是否被锁定
    if (post.isLocked) {
      throw new BadRequestException('帖子已被锁定，无法评论');
    }

    // 如果有 parentId，检查父评论是否存在
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException('父评论不属于该帖子');
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

    return comment;
  }

  async findAll(postId: string, query: QueryCommentDto) {
    // 检查帖子是否存在
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
        orderBy: { createdAt: 'asc' },
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
