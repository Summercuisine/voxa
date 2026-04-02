import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { AIMessage } from '../ai/ai-engine.interface';

@Injectable()
export class BotSchedulerService {
  private readonly logger = new Logger(BotSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  /**
   * 每天 8:00/12:00/18:00 自动发帖
   */
  @Cron('0 8,12,18 * * *')
  async handleBotAutoPost() {
    this.logger.log('开始执行 Bot 自动发帖任务');

    try {
      const activeBots = await this.prisma.bot.findMany({
        where: { isActive: true },
        include: {
          user: { select: { id: true, username: true } },
          rssSources: { where: { isActive: true } },
        },
      });

      if (activeBots.length === 0) {
        this.logger.log('没有活跃的 Bot，跳过自动发帖');
        return;
      }

      for (const bot of activeBots) {
        try {
          const postCount = this.parseFrequency(bot.postFrequency);
          this.logger.log(
            `Bot ${bot.name} 计划发帖 ${postCount} 篇`,
          );

          for (let i = 0; i < postCount; i++) {
            try {
              let title = '';
              let content = '';
              let sourceUrl: string | undefined;

              // 尝试从 RSS 源抓取内容
              if (bot.rssSources.length > 0) {
                const rssSource = bot.rssSources[Math.floor(Math.random() * bot.rssSources.length)];
                const rssContent = await this.fetchRssContent(rssSource.url);

                if (rssContent) {
                  content = await this.aiService.rewriteRssContent(
                    rssContent,
                    bot.personality,
                  );
                  title = await this.aiService.generatePost(content);
                  sourceUrl = rssSource.url;
                }
              }

              // 如果没有 RSS 内容，用 AI 直接生成
              if (!content) {
                const topic = bot.topics.length > 0
                  ? bot.topics[Math.floor(Math.random() * bot.topics.length)]
                  : '技术';

                const aiResponse = await this.aiService.generate([
                  {
                    role: 'system',
                    content: bot.systemPrompt,
                  },
                  {
                    role: 'user',
                    content: `请围绕「${topic}」话题生成一篇社区帖子。帖子应包含标题和正文内容。请使用以下格式：\n标题：xxx\n\n正文：xxx`,
                  },
                ]);

                const parsed = this.parsePostContent(aiResponse.content);
                title = parsed.title;
                content = parsed.content;
              }

              // 创建帖子
              const slug =
                title
                  .toLowerCase()
                  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                  .replace(/^-|-$/g, '') +
                '-' +
                Date.now();

              const post = await this.prisma.post.create({
                data: {
                  title,
                  content,
                  slug,
                  authorId: bot.userId,
                  sourceUrl,
                },
              });

              // 记录 BotLog
              await this.prisma.botLog.create({
                data: {
                  action: 'POST_CREATED',
                  targetType: 'post',
                  targetId: post.id,
                  botId: bot.id,
                  metadata: { title, sourceUrl },
                },
              });

              this.logger.log(
                `Bot ${bot.name} 成功创建帖子: ${title}`,
              );
            } catch (postError) {
              this.logger.error(
                `Bot ${bot.name} 创建帖子失败: ${(postError as Error).message}`,
              );
            }
          }
        } catch (botError) {
          this.logger.error(
            `Bot ${bot.name} 自动发帖任务失败: ${(botError as Error).message}`,
          );
        }
      }

      this.logger.log('Bot 自动发帖任务完成');
    } catch (error) {
      this.logger.error(
        `自动发帖任务执行失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 每天 9:00/13:00/19:00 自动评论
   */
  @Cron('0 9,13,19 * * *')
  async handleBotAutoComment() {
    this.logger.log('开始执行 Bot 自动评论任务');

    try {
      const activeBots = await this.prisma.bot.findMany({
        where: { isActive: true },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      if (activeBots.length === 0) {
        this.logger.log('没有活跃的 Bot，跳过自动评论');
        return;
      }

      // 获取最近的帖子
      const recentPosts = await this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        where: { authorId: { notIn: activeBots.map((b) => b.userId) } },
        select: { id: true, title: true, content: true },
      });

      if (recentPosts.length === 0) {
        this.logger.log('没有可评论的帖子，跳过自动评论');
        return;
      }

      for (const bot of activeBots) {
        try {
          const commentCount = this.parseFrequency(bot.commentFrequency);
          this.logger.log(
            `Bot ${bot.name} 计划评论 ${commentCount} 条`,
          );

          // 随机选择帖子
          const shuffled = [...recentPosts].sort(() => Math.random() - 0.5);
          const selectedPosts = shuffled.slice(0, commentCount);

          for (const post of selectedPosts) {
            try {
              const commentContent = await this.aiService.generateComment(
                post.title,
                post.content,
                bot.personality,
              );

              const comment = await this.prisma.comment.create({
                data: {
                  content: commentContent,
                  authorId: bot.userId,
                  postId: post.id,
                },
              });

              await this.prisma.botLog.create({
                data: {
                  action: 'COMMENT_CREATED',
                  targetType: 'comment',
                  targetId: comment.id,
                  botId: bot.id,
                  metadata: { postId: post.id, postTitle: post.title },
                },
              });

              this.logger.log(
                `Bot ${bot.name} 成功评论帖子 ${post.id}`,
              );
            } catch (commentError) {
              this.logger.error(
                `Bot ${bot.name} 评论失败: ${(commentError as Error).message}`,
              );
            }
          }
        } catch (botError) {
          this.logger.error(
            `Bot ${bot.name} 自动评论任务失败: ${(botError as Error).message}`,
          );
        }
      }

      this.logger.log('Bot 自动评论任务完成');
    } catch (error) {
      this.logger.error(
        `自动评论任务执行失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 每 30 分钟自动回复评论
   */
  @Cron('*/30 * * * *')
  async handleBotAutoReply() {
    this.logger.log('开始执行 Bot 自动回复任务');

    try {
      const activeBots = await this.prisma.bot.findMany({
        where: { isActive: true, autoReply: true },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      if (activeBots.length === 0) {
        this.logger.log('没有启用自动回复的 Bot，跳过');
        return;
      }

      for (const bot of activeBots) {
        try {
          // 查找 Bot 帖子的新评论（非 Bot 发送的，且未被回复的）
          const botPostIds = await this.prisma.post
            .findMany({
              where: { authorId: bot.userId },
              select: { id: true },
            })
            .then((posts) => posts.map((p) => p.id));

          if (botPostIds.length === 0) continue;

          // 获取 Bot 帖子上的评论
          const recentComments = await this.prisma.comment.findMany({
            where: {
              postId: { in: botPostIds },
              authorId: { not: bot.userId },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              post: { select: { id: true, title: true } },
            },
          });

          for (const comment of recentComments) {
            try {
              // 检查是否已回复
              const existingReply = await this.prisma.comment.findFirst({
                where: {
                  parentId: comment.id,
                  authorId: bot.userId,
                },
              });

              if (existingReply) continue;

              const replyContent = await this.aiService.generateReply(
                comment.content,
                bot.personality,
              );

              const reply = await this.prisma.comment.create({
                data: {
                  content: replyContent,
                  authorId: bot.userId,
                  postId: comment.postId,
                  parentId: comment.id,
                },
              });

              await this.prisma.botLog.create({
                data: {
                  action: 'REPLY_SENT',
                  targetType: 'comment',
                  targetId: reply.id,
                  botId: bot.id,
                  metadata: {
                    originalCommentId: comment.id,
                    postId: comment.postId,
                  },
                },
              });

              this.logger.log(
                `Bot ${bot.name} 成功回复评论 ${comment.id}`,
              );
            } catch (replyError) {
              this.logger.error(
                `Bot ${bot.name} 回复评论失败: ${(replyError as Error).message}`,
              );
            }
          }
        } catch (botError) {
          this.logger.error(
            `Bot ${bot.name} 自动回复任务失败: ${(botError as Error).message}`,
          );
        }
      }

      this.logger.log('Bot 自动回复任务完成');
    } catch (error) {
      this.logger.error(
        `自动回复任务执行失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 每 15 分钟自动回复私信
   */
  @Cron('*/15 * * * *')
  async handleBotAutoMessage() {
    this.logger.log('开始执行 Bot 自动回复私信任务');

    try {
      const activeBots = await this.prisma.bot.findMany({
        where: { isActive: true, autoMessage: true },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      if (activeBots.length === 0) {
        this.logger.log('没有启用自动回复私信的 Bot，跳过');
        return;
      }

      for (const bot of activeBots) {
        try {
          // 获取 Bot 参与的会话
          const botConversations = await this.prisma.conversationParticipant.findMany({
            where: { userId: bot.userId },
            select: { conversationId: true },
          });

          const conversationIds = botConversations.map(
            (c) => c.conversationId,
          );

          if (conversationIds.length === 0) continue;

          // 查找 Bot 收到的未回复消息
          const unrepliedMessages = await this.prisma.message.findMany({
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: bot.userId },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              conversation: {
                include: {
                  messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 10,
                    include: {
                      sender: { select: { id: true, username: true } },
                    },
                  },
                },
              },
            },
          });

          for (const msg of unrepliedMessages) {
            try {
              // 检查 Bot 是否已回复（在该消息之后有 Bot 发送的消息）
              const hasReplied = await this.prisma.message.findFirst({
                where: {
                  conversationId: msg.conversationId,
                  senderId: bot.userId,
                  createdAt: { gt: msg.createdAt },
                },
              });

              if (hasReplied) continue;

              // 构建对话历史
              const conversationHistory: AIMessage[] = msg.conversation.messages.map(
                (m) => ({
                  role: m.senderId === bot.userId ? 'assistant' : 'user',
                  content: m.content,
                }),
              );

              const replyContent = await this.aiService.generateMessage(
                conversationHistory,
                bot.personality,
              );

              const message = await this.prisma.message.create({
                data: {
                  content: replyContent,
                  senderId: bot.userId,
                  conversationId: msg.conversationId,
                },
              });

              // 更新会话最后消息时间
              await this.prisma.conversation.update({
                where: { id: msg.conversationId },
                data: { lastMessageAt: message.createdAt },
              });

              await this.prisma.botLog.create({
                data: {
                  action: 'MESSAGE_SENT',
                  targetType: 'message',
                  targetId: message.id,
                  botId: bot.id,
                  metadata: {
                    conversationId: msg.conversationId,
                    originalMessageId: msg.id,
                  },
                },
              });

              this.logger.log(
                `Bot ${bot.name} 成功回复私信，会话 ${msg.conversationId}`,
              );
            } catch (messageError) {
              this.logger.error(
                `Bot ${bot.name} 回复私信失败: ${(messageError as Error).message}`,
              );
            }
          }
        } catch (botError) {
          this.logger.error(
            `Bot ${bot.name} 自动回复私信任务失败: ${(botError as Error).message}`,
          );
        }
      }

      this.logger.log('Bot 自动回复私信任务完成');
    } catch (error) {
      this.logger.error(
        `自动回复私信任务执行失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 解析频率字符串（如 "3-5"）为随机数
   */
  private parseFrequency(frequency: string): number {
    const parts = frequency.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 1;
      const max = parseInt(parts[1], 10) || 1;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return parseInt(frequency, 10) || 1;
  }

  /**
   * 抓取 RSS 源内容
   */
  private async fetchRssContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VoxaBot/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.logger.warn(`RSS 抓取失败: ${url} - ${response.status}`);
        return null;
      }

      const text = await response.text();

      // 简单提取 RSS 内容（提取 item 中的 title 和 description）
      const titleMatches = text.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/g)
        || text.match(/<title>([\s\S]*?)<\/title>/g);

      const descMatches = text.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g)
        || text.match(/<description>([\s\S]*?)<\/description>/g);

      if (titleMatches && titleMatches.length > 0) {
        const titles = titleMatches
          .slice(0, 3)
          .map((m) => m.replace(/<[^>]*>/g, '').trim());
        const descriptions = descMatches
          ? descMatches
              .slice(0, 3)
              .map((m) => m.replace(/<[^>]*>/g, '').trim())
          : [];

        let content = titles.join('\n\n');
        if (descriptions.length > 0) {
          content += '\n\n' + descriptions.join('\n\n');
        }

        return content;
      }

      return null;
    } catch (error) {
      this.logger.warn(`RSS 抓取异常: ${url} - ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * 解析 AI 生成的帖子内容（提取标题和正文）
   */
  private parsePostContent(generated: string): { title: string; content: string } {
    // 尝试匹配 "标题：xxx" 格式
    const titleMatch = generated.match(/标题[：:]\s*(.+)/);
    const contentMatch = generated.match(/正文[：:]\s*([\s\S]+)/);

    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
      };
    }

    // 尝试按换行分割，第一行作为标题
    const lines = generated.split('\n').filter((l) => l.trim());
    if (lines.length >= 2) {
      return {
        title: lines[0].trim(),
        content: lines.slice(1).join('\n').trim(),
      };
    }

    // 无法解析时，使用默认标题
    return {
      title: generated.substring(0, 50).trim() || '技术分享',
      content: generated.trim(),
    };
  }
}
