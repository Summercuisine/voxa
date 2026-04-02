import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      ...user,
      postCount: user._count.posts,
      commentCount: user._count.comments,
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (currentUserId && currentUserId !== id) {
      throw new ForbiddenException('只能更新自己的资料');
    }

    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new ForbiddenException('用户名已被占用');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.username && { username: dto.username }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getProfilePosts(id: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: id },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          isPinned: true,
          isLocked: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({
        where: { authorId: id },
      }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
