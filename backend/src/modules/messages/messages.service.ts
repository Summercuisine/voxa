import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.recipientId) {
      throw new BadRequestException('不能与自己创建会话');
    }

    // 检查对方用户是否存在
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('对方用户不存在');
    }

    // 检查是否已存在两人会话
    const existingParticipant = await this.prisma.conversationParticipant.findFirst({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: dto.recipientId },
            },
          },
        },
      },
    });

    if (existingParticipant) {
      const hasRecipient = existingParticipant.conversation.participants.length > 0;
      if (hasRecipient) {
        return this.getConversationDetail(existingParticipant.conversationId, userId);
      }
    }

    // 创建新会话
    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        lastMessageAt: new Date(),
        participants: {
          create: [
            { userId },
            { userId: dto.recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    return conversation;
  }

  async getConversations(userId: string, query: QueryConversationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, username: true, avatar: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, username: true, avatar: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc',
        },
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.conversationParticipant.count({
      where: { userId },
    });

    const data = participants.map((p) => {
      const conversation = p.conversation;
      const otherParticipant = conversation.participants.find(
        (cp) => cp.userId !== userId,
      );
      const lastMessage = conversation.messages[0] || null;

      // 计算未读数
      const unreadCount = lastMessage && lastMessage.senderId !== userId && !lastMessage.isRead
        ? 1
        : 0;

      return {
        id: conversation.id,
        type: conversation.type,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage,
        unreadCount,
        otherUser: otherParticipant?.user || null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });

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

  async getMessages(
    userId: string,
    conversationId: string,
    query: QueryConversationDto,
  ) {
    // 验证用户是会话参与者
    await this.verifyParticipant(userId, conversationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    // 标记会话为已读
    await this.markAsRead(userId, conversationId);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    // 验证用户是会话参与者
    await this.verifyParticipant(userId, conversationId);

    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // 更新会话最后消息时间
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    return message;
  }

  async markAsRead(userId: string, conversationId: string) {
    // 验证用户是会话参与者
    await this.verifyParticipant(userId, conversationId);

    // 将该会话中非当前用户发送的未读消息标记为已读
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // 更新参与者的最后阅读时间
    await this.prisma.conversationParticipant.updateMany({
      where: {
        userId,
        conversationId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { message: '已标记为已读' };
  }

  async getUnreadCount(userId: string) {
    // 获取用户参与的所有会话
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = conversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return { count: 0 };
    }

    const count = await this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { count };
  }

  async deleteConversation(userId: string, conversationId: string) {
    // 验证用户是会话参与者
    await this.verifyParticipant(userId, conversationId);

    // 删除会话（级联删除消息和参与者）
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: '会话已删除' };
  }

  private async verifyParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('无权操作此会话');
    }
  }

  private async getConversationDetail(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== userId,
    );
    const lastMessage = conversation.messages[0] || null;

    return {
      id: conversation.id,
      type: conversation.type,
      lastMessageAt: conversation.lastMessageAt,
      lastMessage,
      unreadCount: 0,
      otherUser: otherParticipant?.user || null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
