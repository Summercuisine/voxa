import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async addExperience(
    userId: string,
    amount: number,
    type: string,
    description?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, experience: true, level: true },
    });

    if (!user) return null;

    const newExperience = user.experience + amount;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { experience: newExperience },
      select: { id: true, experience: true, level: true },
    });

    await this.prisma.experienceLog.create({
      data: {
        userId,
        amount,
        type,
        description: description || null,
      },
    });

    await this.checkLevelUp(userId);

    return updatedUser;
  }

  async checkLevelUp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, experience: true, level: true },
    });

    if (!user) return null;

    const configs = await this.prisma.levelConfig.findMany({
      orderBy: { level: 'asc' },
    });

    if (configs.length === 0) return user;

    let newLevel = user.level;

    for (const config of configs) {
      if (user.experience >= config.minExp) {
        newLevel = config.level;
      } else {
        break;
      }
    }

    if (newLevel !== user.level) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return { ...user, level: newLevel };
  }

  async getLevelConfig(level: number) {
    return this.prisma.levelConfig.findUnique({
      where: { level },
    });
  }

  async getAllLevelConfigs() {
    return this.prisma.levelConfig.findMany({
      orderBy: { level: 'asc' },
    });
  }

  async getUserLevel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        experience: true,
        title: true,
      },
    });

    if (!user) return null;

    const currentConfig = await this.prisma.levelConfig.findUnique({
      where: { level: user.level },
    });

    const nextConfig = await this.prisma.levelConfig.findUnique({
      where: { level: user.level + 1 },
    });

    let progress = 100;
    let expToNext = 0;

    if (currentConfig && nextConfig) {
      const range = nextConfig.minExp - currentConfig.minExp;
      const current = user.experience - currentConfig.minExp;
      progress = range > 0 ? Math.min(Math.round((current / range) * 100), 100) : 100;
      expToNext = nextConfig.minExp - user.experience;
    }

    return {
      ...user,
      levelConfig: currentConfig,
      nextLevelConfig: nextConfig,
      progress,
      expToNext,
    };
  }

  async seedLevelConfigs() {
    const existing = await this.prisma.levelConfig.count();
    if (existing > 0) {
      return { message: '等级配置已存在，跳过初始化', count: existing };
    }

    const configs = [
      { level: 1, name: '新手', minExp: 0, maxExp: 50, icon: '🌱', color: '#8B9467' },
      { level: 2, name: '见习', minExp: 50, maxExp: 120, icon: '🌿', color: '#6B8E23' },
      { level: 3, name: '初级', minExp: 120, maxExp: 220, icon: '🍀', color: '#3CB371' },
      { level: 4, name: '中级', minExp: 220, maxExp: 370, icon: '⚔️', color: '#4682B4' },
      { level: 5, name: '高级', minExp: 370, maxExp: 570, icon: '🛡️', color: '#4169E1' },
      { level: 6, name: '精英', minExp: 570, maxExp: 830, icon: '💎', color: '#6A5ACD' },
      { level: 7, name: '大师', minExp: 830, maxExp: 1160, icon: '👑', color: '#9370DB' },
      { level: 8, name: '宗师', minExp: 1160, maxExp: 1570, icon: '🔥', color: '#DC143C' },
      { level: 9, name: '传说', minExp: 1570, maxExp: 2070, icon: '⚡', color: '#FF8C00' },
      { level: 10, name: '神话', minExp: 2070, maxExp: 2680, icon: '🌟', color: '#FFD700' },
      { level: 11, name: '超凡', minExp: 2680, maxExp: 3480, icon: '🌈', color: '#FF69B4' },
      { level: 12, name: '入圣', minExp: 3480, maxExp: 4380, icon: '🐉', color: '#E74C3C' },
      { level: 13, name: '化神', minExp: 4380, maxExp: 5380, icon: '🔮', color: '#9B59B6' },
      { level: 14, name: '渡劫', minExp: 5380, maxExp: 6580, icon: '🌩️', color: '#2C3E50' },
      { level: 15, name: '大乘', minExp: 6580, maxExp: 7980, icon: '🧘', color: '#1ABC9C' },
      { level: 16, name: '真仙', minExp: 7980, maxExp: 9580, icon: '✨', color: '#F39C12' },
      { level: 17, name: '金仙', minExp: 9580, maxExp: 11380, icon: '🏅', color: '#D4AC0D' },
      { level: 18, name: '太乙', minExp: 11380, maxExp: 13380, icon: '🏆', color: '#E67E22' },
      { level: 19, name: '大罗', minExp: 13380, maxExp: 15580, icon: '💫', color: '#C0392B' },
      { level: 20, name: '道祖', minExp: 15580, maxExp: 99999, icon: '🕉️', color: '#8E44AD' },
    ];

    const result = await this.prisma.levelConfig.createMany({
      data: configs,
    });

    return { message: '等级配置初始化成功', count: result.count };
  }
}
