// Mock for Prisma generated client - used in Jest tests
// This avoids issues with import.meta in the generated Prisma client

export const Prisma = {
  ModelName: {
    User: 'User',
    Post: 'Post',
    Comment: 'Comment',
    Category: 'Category',
    Tag: 'Tag',
    PostTag: 'PostTag',
    Like: 'Like',
    Bookmark: 'Bookmark',
    Message: 'Message',
    Conversation: 'Conversation',
    ConversationParticipant: 'ConversationParticipant',
    Notification: 'Notification',
    Bot: 'Bot',
    BotLog: 'BotLog',
    RssSource: 'RssSource',
  },
};

export class PrismaClient {
  user: any = {};
  post: any = {};
  comment: any = {};
  category: any = {};
  tag: any = {};
  postTag: any = {};
  like: any = {};
  bookmark: any = {};
  message: any = {};
  conversation: any = {};
  conversationParticipant: any = {};
  notification: any = {};
  bot: any = {};
  botLog: any = {};
  rssSource: any = {};

  async $connect() {}
  async $disconnect() {}
}

export default PrismaClient;
