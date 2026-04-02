import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { GamificationService } from '../gamification/gamification.service.js';

interface BadgeCheckResult {
  slug: string;
  awarded: boolean;
}

@Injectable()
export class BadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll() {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return userBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }));
  }

  async checkAndAwardBadges(userId: string): Promise<BadgeCheckResult[]> {
    const results: BadgeCheckResult[] = [];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        level: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) return results;

    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId));

    const allBadges = await this.prisma.badge.findMany();
    const badgeBySlug = new Map(allBadges.map((b) => [b.slug, b]));

    const checks: { slug: string; conditionMet: boolean }[] = [];

    // 🌟 初次发帖: 发表第 1 篇帖子
    checks.push({
      slug: 'first-post',
      conditionMet: user._count.posts >= 1,
    });

    // 📝 十帖达人: 发表 10 篇帖子
    checks.push({
      slug: 'ten-posts',
      conditionMet: user._count.posts >= 10,
    });

    // 📚 百帖宗师: 发表 100 篇帖子
    checks.push({
      slug: 'hundred-posts',
      conditionMet: user._count.posts >= 100,
    });

    // 💬 话唠: 发表 50 条评论
    checks.push({
      slug: 'chatterbox',
      conditionMet: user._count.comments >= 50,
    });

    // ❤️ 人气之星: 获得 100 个赞
    const totalLikes = await this.prisma.like.count({
      where: {
        post: { authorId: userId },
      },
    });
    checks.push({
      slug: 'pop-star',
      conditionMet: totalLikes >= 100,
    });

    // 🔥 热门作者: 单帖获得 50 个赞
    const maxPostLikes = await this.prisma.like.groupBy({
      by: ['postId'],
      where: {
        post: { authorId: userId },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });
    checks.push({
      slug: 'hot-author',
      conditionMet: (maxPostLikes[0]?._count?.id ?? 0) >= 50,
    });

    // 🏆 连续登录7天: 连续登录 7 天
    // This is a simplified check - in production you'd track login history
    const loginLogs = await this.prisma.experienceLog.findMany({
      where: { userId, type: 'DAILY_LOGIN' },
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { createdAt: true },
    });
    const hasConsecutiveLogin = loginLogs.length >= 7;
    checks.push({
      slug: 'consecutive-login-7',
      conditionMet: hasConsecutiveLogin,
    });

    // 🎯 早期用户: 注册时间在项目上线 30 天内
    const projectStartDate = new Date('2025-01-01');
    const isEarlyUser =
      user.createdAt >= projectStartDate &&
      user.createdAt <= new Date(projectStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    checks.push({
      slug: 'early-adopter',
      conditionMet: isEarlyUser,
    });

    // 💎 资深用户: 注册超过 365 天
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    checks.push({
      slug: 'veteran',
      conditionMet: user.createdAt <= oneYearAgo,
    });

    // 🤖 AI之友: 向 AI Bot 发送过私信
    const hasMessagedBot = await this.prisma.message.count({
      where: {
        senderId: userId,
        conversation: {
          participants: {
            some: {
              user: { isBot: true },
            },
          },
        },
      },
    });
    checks.push({
      slug: 'ai-friend',
      conditionMet: hasMessagedBot > 0,
    });

    // 📌 话题达人: 帖子被置顶
    const pinnedPosts = await this.prisma.post.count({
      where: { authorId: userId, isPinned: true },
    });
    checks.push({
      slug: 'topic-master',
      conditionMet: pinnedPosts > 0,
    });

    // ⭐ 社区之星: 等级达到 10
    checks.push({
      slug: 'community-star',
      conditionMet: user.level >= 10,
    });

    for (const check of checks) {
      const badge = badgeBySlug.get(check.slug);
      if (!badge) continue;
      if (existingBadgeIds.has(badge.id)) continue;

      if (check.conditionMet) {
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
        results.push({ slug: check.slug, awarded: true });

        // 获得徽章额外经验
        await this.gamificationService.addExperience(
          userId,
          20,
          'BADGE_EARNED',
          `获得徽章: ${badge.name}`,
        );
      } else {
        results.push({ slug: check.slug, awarded: false });
      }
    }

    return results;
  }

  async awardBadge(userId: string, badgeSlug: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { slug: badgeSlug },
    });

    if (!badge) {
      throw new NotFoundException('徽章不存在');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const existing = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: badge.id },
      },
    });

    if (existing) {
      throw new ConflictException('用户已拥有该徽章');
    }

    const userBadge = await this.prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
      include: {
        badge: true,
      },
    });

    return {
      message: `已为用户 ${user.username} 颁发徽章 ${badge.name}`,
      badge: userBadge.badge,
      earnedAt: userBadge.earnedAt,
    };
  }

  async seedBadges() {
    const existing = await this.prisma.badge.count();
    if (existing > 0) {
      return { message: '徽章已存在，跳过初始化', count: existing };
    }

    const badges = [
      {
        name: '初次发帖',
        slug: 'first-post',
        description: '发表第 1 篇帖子',
        icon: '🌟',
        category: 'POST',
        isRare: false,
        condition: { type: 'post_count', value: 1 },
      },
      {
        name: '十帖达人',
        slug: 'ten-posts',
        description: '发表 10 篇帖子',
        icon: '📝',
        category: 'POST',
        isRare: false,
        condition: { type: 'post_count', value: 10 },
      },
      {
        name: '百帖宗师',
        slug: 'hundred-posts',
        description: '发表 100 篇帖子',
        icon: '📚',
        category: 'POST',
        isRare: true,
        condition: { type: 'post_count', value: 100 },
      },
      {
        name: '话唠',
        slug: 'chatterbox',
        description: '发表 50 条评论',
        icon: '💬',
        category: 'COMMENT',
        isRare: false,
        condition: { type: 'comment_count', value: 50 },
      },
      {
        name: '人气之星',
        slug: 'pop-star',
        description: '获得 100 个赞',
        icon: '❤️',
        category: 'SOCIAL',
        isRare: true,
        condition: { type: 'like_received', value: 100 },
      },
      {
        name: '热门作者',
        slug: 'hot-author',
        description: '单帖获得 50 个赞',
        icon: '🔥',
        category: 'POST',
        isRare: true,
        condition: { type: 'single_post_likes', value: 50 },
      },
      {
        name: '连续登录7天',
        slug: 'consecutive-login-7',
        description: '连续登录 7 天',
        icon: '🏆',
        category: 'SPECIAL',
        isRare: false,
        condition: { type: 'consecutive_login', value: 7 },
      },
      {
        name: '早期用户',
        slug: 'early-adopter',
        description: '注册时间在项目上线 30 天内',
        icon: '🎯',
        category: 'SPECIAL',
        isRare: true,
        condition: { type: 'early_user', value: 30 },
      },
      {
        name: '资深用户',
        slug: 'veteran',
        description: '注册超过 365 天',
        icon: '💎',
        category: 'SPECIAL',
        isRare: false,
        condition: { type: 'account_age_days', value: 365 },
      },
      {
        name: 'AI之友',
        slug: 'ai-friend',
        description: '向 AI Bot 发送过私信',
        icon: '🤖',
        category: 'SOCIAL',
        isRare: false,
        condition: { type: 'messaged_bot', value: 1 },
      },
      {
        name: '话题达人',
        slug: 'topic-master',
        description: '帖子被置顶',
        icon: '📌',
        category: 'POST',
        isRare: true,
        condition: { type: 'pinned_post', value: 1 },
      },
      {
        name: '社区之星',
        slug: 'community-star',
        description: '等级达到 10',
        icon: '⭐',
        category: 'SPECIAL',
        isRare: true,
        condition: { type: 'level_reached', value: 10 },
      },
    ];

    const result = await this.prisma.badge.createMany({
      data: badges,
    });

    return { message: '徽章初始化成功', count: result.count };
  }
}
