import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getByLevel(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      orderBy: [{ level: 'desc' }, { experience: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        experience: true,
        title: true,
      },
    });

    const total = await this.prisma.user.count();

    const data = users.map((user, index) => ({
      rank: skip + index + 1,
      user,
      value: user.experience,
    }));

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

  async getByPosts(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      orderBy: { posts: { _count: 'desc' } },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        title: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    const total = await this.prisma.user.count();

    const data = users.map((user, index) => ({
      rank: skip + index + 1,
      user,
      value: user._count.posts,
    }));

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

  async getByLikes(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      orderBy: { posts: { _count: 'desc' } },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        title: true,
        posts: {
          select: {
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    });

    const total = await this.prisma.user.count();

    const data = users
      .map((user, index) => {
        const totalLikes = user.posts.reduce(
          (sum, post) => sum + post._count.likes,
          0,
        );
        return {
          rank: skip + index + 1,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            level: user.level,
            title: user.title,
          },
          value: totalLikes,
        };
      })
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({ ...item, rank: skip + index + 1 }));

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

  async getByComments(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      orderBy: { comments: { _count: 'desc' } },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        title: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    const total = await this.prisma.user.count();

    const data = users.map((user, index) => ({
      rank: skip + index + 1,
      user,
      value: user._count.comments,
    }));

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
}
