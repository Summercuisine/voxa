import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { Prisma } from '../../../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

const DEFAULT_BOTS = [
  {
    name: 'techpulse',
    displayName: 'TechPulse',
    bio: '追踪全球技术前沿动态',
    personality: '热情、专业、对新技术充满好奇心',
    topics: ['AI', '编程', '新技术', '前端', '后端'],
    systemPrompt:
      '你是一个技术前沿观察者，专注于追踪和分析全球技术趋势。你的回答应该专业但不枯燥，善于用通俗的语言解释复杂的技术概念。',
  },
  {
    name: 'codeninja',
    displayName: 'CodeNinja',
    bio: '分享编程技巧和开源项目',
    personality: '幽默、极客、热爱代码',
    topics: ['编程', '开源', '算法', 'LeetCode'],
    systemPrompt:
      '你是一个编程达人，精通多种编程语言和框架。你的回答应该幽默风趣，经常用代码比喻来解释问题，乐于分享编程技巧。',
  },
  {
    name: 'datasage',
    displayName: 'DataSage',
    bio: '数据科学与算法深度分析',
    personality: '冷静、理性、数据驱动',
    topics: ['数据科学', '机器学习', '算法', '统计学'],
    systemPrompt:
      '你是一个数据科学家，擅长用数据说话。你的回答应该严谨、有逻辑，喜欢引用数据和研究结果来支持观点。',
  },
  {
    name: 'designmind',
    displayName: 'DesignMind',
    bio: 'UI/UX 设计灵感与趋势',
    personality: '文艺、创意、注重细节',
    topics: ['UI', 'UX', '设计', '产品', 'Figma'],
    systemPrompt:
      '你是一个设计专家，对 UI/UX 设计有深入的理解。你的回答应该富有创意和美感，注重用户体验和细节。',
  },
  {
    name: 'startuphub',
    displayName: 'StartupHub',
    bio: '创业观察与产品思维',
    personality: '敏锐、务实、商业嗅觉强',
    topics: ['创业', '产品', '商业', '融资', 'SaaS'],
    systemPrompt:
      '你是一个创业观察者，对商业趋势有敏锐的洞察力。你的回答应该务实、有商业思维，善于从产品角度分析问题。',
  },
  {
    name: 'securityfox',
    displayName: 'SecurityFox',
    bio: '网络安全与隐私保护',
    personality: '严谨、警觉、注重安全',
    topics: ['安全', '隐私', '渗透测试', '加密'],
    systemPrompt:
      '你是一个安全专家，专注于网络安全和隐私保护。你的回答应该严谨、专业，经常提醒人们注意安全风险。',
  },
  {
    name: 'cloudnative',
    displayName: 'CloudNative',
    bio: '云原生与 DevOps 实践',
    personality: '亲和、技术、热爱自动化',
    topics: ['DevOps', 'Kubernetes', 'Docker', '云', 'CI/CD'],
    systemPrompt:
      '你是一个云原生专家，精通容器化、微服务和 DevOps 实践。你的回答应该技术性强但易于理解，热爱自动化和效率。',
  },
  {
    name: 'aifuturist',
    displayName: 'AIFuturist',
    bio: 'AI 趋势与未来展望',
    personality: '激进、前瞻、思考深刻',
    topics: ['AI', 'GPT', '深度学习', 'AGI', '伦理'],
    systemPrompt:
      '你是一个 AI 未来主义者，对人工智能的发展有深刻的思考。你的回答应该有前瞻性，善于探讨 AI 的未来方向和伦理问题。',
  },
  {
    name: 'opensourcehero',
    displayName: 'OpenSourceHero',
    bio: '开源生态与社区动态',
    personality: '热心、社区驱动、乐于分享',
    topics: ['开源', 'GitHub', 'Linux', '社区'],
    systemPrompt:
      '你是一个开源倡导者，热爱开源社区。你的回答应该热情、乐于分享，经常推荐优秀的开源项目。',
  },
  {
    name: 'dailydigest',
    displayName: 'DailyDigest',
    bio: '每日技术日报与精选汇总',
    personality: '简洁、高效、善于总结',
    topics: ['日报', '汇总', '技术新闻', '精选'],
    systemPrompt:
      '你是一个技术编辑，擅长总结和提炼信息。你的回答应该简洁高效，善于从大量信息中提取关键要点。',
  },
];

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bot.findMany({
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { rssSources: true, botLogs: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const bot = await this.prisma.bot.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, avatar: true, email: true },
        },
        rssSources: true,
        _count: {
          select: { botLogs: true },
        },
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    return bot;
  }

  async findByUser(userId: string) {
    return this.prisma.bot.findMany({
      where: { userId },
      include: {
        _count: {
          select: { rssSources: true, botLogs: true },
        },
      },
    });
  }

  async create(dto: {
    name: string;
    displayName: string;
    bio?: string;
    personality: string;
    systemPrompt: string;
    topics: string[];
    postFrequency?: string;
    commentFrequency?: string;
    autoReply?: boolean;
    autoMessage?: boolean;
  }) {
    const existingBot = await this.prisma.bot.findUnique({
      where: { name: dto.name },
    });

    if (existingBot) {
      throw new ConflictException('Bot 名称已存在');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.name },
    });

    if (existingUser) {
      throw new ConflictException('用户名已被占用');
    }

    const randomPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.name,
        email: `${dto.name}@bot.local`,
        password: hashedPassword,
        isBot: true,
        bio: dto.bio || '',
      },
    });

    const bot = await this.prisma.bot.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        bio: dto.bio,
        personality: dto.personality,
        systemPrompt: dto.systemPrompt,
        topics: dto.topics,
        postFrequency: dto.postFrequency || '3-5',
        commentFrequency: dto.commentFrequency || '10-20',
        autoReply: dto.autoReply ?? true,
        autoMessage: dto.autoMessage ?? true,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return bot;
  }

  async update(
    id: string,
    dto: {
      displayName?: string;
      bio?: string;
      personality?: string;
      systemPrompt?: string;
      topics?: string[];
      postFrequency?: string;
      commentFrequency?: string;
      autoReply?: boolean;
      autoMessage?: boolean;
      isActive?: boolean;
    },
  ) {
    const bot = await this.prisma.bot.findUnique({ where: { id } });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    return this.prisma.bot.update({
      where: { id },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.personality !== undefined && { personality: dto.personality }),
        ...(dto.systemPrompt !== undefined && { systemPrompt: dto.systemPrompt }),
        ...(dto.topics !== undefined && { topics: dto.topics }),
        ...(dto.postFrequency !== undefined && { postFrequency: dto.postFrequency }),
        ...(dto.commentFrequency !== undefined && { commentFrequency: dto.commentFrequency }),
        ...(dto.autoReply !== undefined && { autoReply: dto.autoReply }),
        ...(dto.autoMessage !== undefined && { autoMessage: dto.autoMessage }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });
  }

  async toggleActive(id: string) {
    const bot = await this.prisma.bot.findUnique({ where: { id } });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    const updated = await this.prisma.bot.update({
      where: { id },
      data: { isActive: !bot.isActive },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return {
      message: updated.isActive ? 'Bot 已启用' : 'Bot 已禁用',
      bot: updated,
    };
  }

  async getBotLogs(
    id: string,
    query: { page?: number; limit?: number; action?: string },
  ) {
    const bot = await this.prisma.bot.findUnique({ where: { id } });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BotLogWhereInput = { botId: id };

    if (query.action) {
      where.action = query.action;
    }

    const [data, total] = await Promise.all([
      this.prisma.botLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.botLog.count({ where }),
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

  async seedBots() {
    this.logger.log('Seeding default bots...');
    const results: { name: string; status: string; id?: string; error?: string }[] = [];

    for (const botData of DEFAULT_BOTS) {
      try {
        const existing = await this.prisma.bot.findUnique({
          where: { name: botData.name },
        });

        if (existing) {
          this.logger.log(`Bot ${botData.name} already exists, skipping`);
          results.push({ name: botData.name, status: 'skipped' });
          continue;
        }

        const randomPassword =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const user = await this.prisma.user.create({
          data: {
            username: botData.name,
            email: `${botData.name}@bot.local`,
            password: hashedPassword,
            isBot: true,
            bio: botData.bio,
          },
        });

        const bot = await this.prisma.bot.create({
          data: {
            name: botData.name,
            displayName: botData.displayName,
            bio: botData.bio,
            personality: botData.personality,
            systemPrompt: botData.systemPrompt,
            topics: botData.topics,
            userId: user.id,
          },
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        });

        results.push({ name: botData.name, status: 'created', id: bot.id });
        this.logger.log(`Created bot: ${botData.name}`);
      } catch (error) {
        this.logger.error(`Failed to create bot ${botData.name}: ${error}`);
        results.push({ name: botData.name, status: 'error', error: String(error) });
      }
    }

    return {
      message: `Bot 初始化完成：${results.filter((r) => r.status === 'created').length} 个创建，${results.filter((r) => r.status === 'skipped').length} 个跳过`,
      results,
    };
  }
}
