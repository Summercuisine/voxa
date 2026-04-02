import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryPostDto } from './dto/query-post.dto.js';
import { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      todayNewPosts,
      todayNewUsers,
      activeBots,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.comment.count(),
      this.prisma.post.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.bot.count({ where: { isActive: true } }),
    ]);

    // 最近 7 天的帖子/用户增长趋势
    const postTrend = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE("created_at") as date, COUNT(*)::bigint as count
      FROM "posts"
      WHERE "created_at" >= ${sevenDaysAgo}
      GROUP BY DATE("created_at")
      ORDER BY date
    `;

    const userTrend = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE("created_at") as date, COUNT(*)::bigint as count
      FROM "users"
      WHERE "created_at" >= ${sevenDaysAgo}
      GROUP BY DATE("created_at")
      ORDER BY date
    `;

    // 填充缺失的日期
    const dateLabels: string[] = [];
    const postTrendData: number[] = [];
    const userTrendData: number[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dateLabels.push(dateStr);

      const postEntry = postTrend.find(
        (p) => p.date.toISOString().split('T')[0] === dateStr,
      );
      postTrendData.push(postEntry ? Number(postEntry.count) : 0);

      const userEntry = userTrend.find(
        (u) => u.date.toISOString().split('T')[0] === dateStr,
      );
      userTrendData.push(userEntry ? Number(userEntry.count) : 0);
    }

    return {
      overview: {
        totalUsers,
        totalPosts,
        totalComments,
        todayNewPosts,
        todayNewUsers,
        activeBots,
      },
      trends: {
        dates: dateLabels,
        posts: postTrendData,
        users: userTrendData,
      },
    };
  }

  async getUsers(query: QueryUserDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          isActive: true,
          isBot: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { posts: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        isBot: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: '用户已删除' };
  }

  async getPosts(query: QueryPostDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status === 'pinned') {
      where.isPinned = true;
    } else if (query.status === 'locked') {
      where.isLocked = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          category: true,
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: { createdAt: 'desc' },
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

  async deletePost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: '帖子已删除' };
  }

  async getBotStats() {
    const bots = await this.prisma.bot.findMany({
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { botLogs: true },
        },
      },
    });

    const stats = await Promise.all(
      bots.map(async (bot) => {
        const postCount = await this.prisma.botLog.count({
          where: {
            botId: bot.id,
            action: 'POST_CREATED',
          },
        });

        const commentCount = await this.prisma.botLog.count({
          where: {
            botId: bot.id,
            action: 'COMMENT_CREATED',
          },
        });

        return {
          id: bot.id,
          name: bot.name,
          displayName: bot.displayName,
          avatar: bot.avatar,
          isActive: bot.isActive,
          user: bot.user,
          postCount,
          commentCount,
          totalActions: bot._count.botLogs,
          createdAt: bot.createdAt,
        };
      }),
    );

    return stats;
  }
}
