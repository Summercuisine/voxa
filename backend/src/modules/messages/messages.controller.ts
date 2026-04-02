import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('私信')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建会话' })
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagesService.createConversation(userId, dto);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取会话列表' })
  getConversations(
    @CurrentUser('id') userId: string,
    @Query() query: QueryConversationDto,
  ) {
    return this.messagesService.getConversations(userId, query);
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取会话消息列表' })
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Query() query: QueryConversationDto,
  ) {
    return this.messagesService.getMessages(userId, conversationId, query);
  }

  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发送消息' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(userId, conversationId, dto);
  }

  @Patch('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '标记会话为已读' })
  markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.messagesService.markAsRead(userId, conversationId);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取未读消息总数' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }

  @Delete('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除会话' })
  deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.messagesService.deleteConversation(userId, conversationId);
  }
}
