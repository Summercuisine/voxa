import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AIEngine, AIMessage, AIResponse } from './ai-engine.interface.js';
import { TemplateEngine } from './engines/template.engine.js';
import { OpenAIEngine } from './engines/openai.engine.js';

export const AI_ENGINE_TOKEN = 'AI_ENGINE';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly engine: AIEngine) {
    this.logger.log(`AI engine initialized: ${engine.name}`);
  }

  async generatePost(content: string): Promise<string> {
    this.logger.log('Generating post title');
    const title = await this.engine.generateTitle(content);
    this.logger.log(`Generated title: ${title}`);
    return title;
  }

  async generateComment(
    postTitle: string,
    postContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.log(`Generating comment for post: ${postTitle}`);
    const comment = await this.engine.generateComment(
      postTitle,
      postContent,
      personality,
    );
    this.logger.log(`Generated comment: ${comment.substring(0, 50)}...`);
    return comment;
  }

  async generateReply(
    commentContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.log('Generating reply');
    const reply = await this.engine.generateReply(commentContent, personality);
    this.logger.log(`Generated reply: ${reply.substring(0, 50)}...`);
    return reply;
  }

  async generateMessage(
    conversationHistory: AIMessage[],
    personality: string,
  ): Promise<string> {
    this.logger.log('Generating message');
    const message = await this.engine.generateMessage(
      conversationHistory,
      personality,
    );
    this.logger.log(`Generated message: ${message.substring(0, 50)}...`);
    return message;
  }

  async rewriteRssContent(
    originalContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.log('Rewriting RSS content');
    const rewritten = await this.engine.rewriteContent(
      originalContent,
      personality,
    );
    this.logger.log(`Rewritten content length: ${rewritten.length}`);
    return rewritten;
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    this.logger.log('Generating AI response');
    return this.engine.generate(messages);
  }

  getEngineName(): string {
    return this.engine.name;
  }
}

export const createAIEngineProvider = {
  provide: AI_ENGINE_TOKEN,
  useFactory: (configService: ConfigService) => {
    const engineType = configService.get<string>('AI_ENGINE') || 'template';

    switch (engineType) {
      case 'openai':
        return new OpenAIEngine(configService);
      case 'template':
      default:
        return new TemplateEngine();
    }
  },
  inject: [ConfigService],
};
