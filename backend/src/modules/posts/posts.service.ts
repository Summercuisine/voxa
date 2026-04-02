import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { QueryPostDto } from './dto/query-post.dto.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { GamificationService } from '../gamification/gamification.service.js';
import { BadgesService } from '../badges/badges.service.js';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly badgesService: BadgesService,
  ) {}

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now()
    );
  }

  private generateTagSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(userId: string, dto: CreatePostDto) {
    const slug = this.generateSlug(dto.title);

    const tagOperations = dto.tags
      ? dto.tags.map((tagName) => ({
          where: { name: tagName },
          create: {
            name: tagName,
            slug: this.generateTagSlug(tagName),
          },
        }))
      : [];

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        slug,
        authorId: userId,
        categoryId: dto.categoryId || null,
        tags: {
          create: tagOperations.length
            ? tagOperations.map((tag) => ({
                tag: {
                  connectOrCreate: tag,
                },
              }))
            : undefined,
        },
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    // 发帖经验 + 检查徽章
    await this.gamificationService.addExperience(
      userId,
      5,
      'POST_CREATED',
      '发布帖子',
    );
    await this.badgesService.checkAndAwardBadges(userId);

    return post;
  }

  async findAll(query: QueryPostDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};

    if (query.category) {
      where.categoryId = query.category;
    }

    if (query.tag) {
      where.tags = {
        some: {
          tag: { name: query.tag },
        },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    switch (query.sort) {
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'pinned':
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          category: true,
          _count: { select: { comments: true, likes: true, bookmarks: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
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
        },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 原子操作更新浏览量
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('只能更新自己的帖子');
    }

    const updateData: Prisma.PostUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.content && { content: dto.content }),
      ...(dto.categoryId !== undefined && {
        category: dto.categoryId
          ? { connect: { id: dto.categoryId } }
          : { disconnect: true },
      }),
    };

    if (dto.tags) {
      // 使用事务包裹标签删除和创建
      await this.prisma.$transaction(async (tx) => {
        await tx.postTag.deleteMany({ where: { postId: id } });

        await tx.post.update({
          where: { id },
          data: {
            tags: {
              create: dto.tags!.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      slug: this.generateTagSlug(tagName),
                    },
                  },
                },
              })),
            },
          },
        });
      });
    }

    return this.prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { role: true } } },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.authorId !== userId && post.author.role !== 'ADMIN') {
      throw new ForbiddenException('只能删除自己的帖子或管理员才能删除');
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: '帖子已删除' };
  }

  async togglePin(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { isPinned: !post.isPinned },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        category: true,
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    return { message: updated.isPinned ? '帖子已置顶' : '帖子已取消置顶', post: updated };
  }

  async toggleLock(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { isLocked: !post.isLocked },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        category: true,
        _count: { select: { comments: true, likes: true, bookmarks: true } },
      },
    });

    return { message: updated.isLocked ? '帖子已锁定' : '帖子已解锁', post: updated };
  }
}
