import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIEngine, AIMessage, AIResponse } from '../ai-engine.interface.js';

@Injectable()
export class OpenAIEngine implements AIEngine {
  private readonly logger = new Logger(OpenAIEngine.name);
  readonly name = 'openai';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    this.baseUrl =
      this.configService.get<string>('OPENAI_BASE_URL') ||
      'https://api.openai.com/v1';
  }

  private async callAPI(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const url = `${this.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || this.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
          }
        : undefined,
    };
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    this.logger.debug('OpenAI engine: generate called');
    return this.callAPI(messages);
  }

  async generateTitle(content: string): Promise<string> {
    this.logger.debug('OpenAI engine: generateTitle called');
    const messages: AIMessage[] = [
      {
        role: 'system',
        content:
          '你是一个标题生成专家。根据给定的内容，生成一个吸引人的中文标题。只返回标题本身，不要包含其他内容。标题长度在 15-50 个字符之间。',
      },
      {
        role: 'user',
        content: `请为以下内容生成一个标题：\n\n${content}`,
      },
    ];
    const response = await this.callAPI(messages);
    return response.content.trim().replace(/^["'《】]|["'》】]$/g, '');
  }

  async generateComment(
    postTitle: string,
    postContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('OpenAI engine: generateComment called');
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个社区评论者，你的性格特点是：${personality}。请根据帖子内容生成一条有见地的中文评论。评论应该自然、真诚，长度在 30-150 字之间。只返回评论内容本身。`,
      },
      {
        role: 'user',
        content: `帖子标题：${postTitle}\n\n帖子内容：${postContent.substring(0, 1000)}`,
      },
    ];
    const response = await this.callAPI(messages);
    return response.content.trim();
  }

  async generateReply(
    commentContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('OpenAI engine: generateReply called');
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个社区用户，你的性格特点是：${personality}。请针对收到的评论生成一条回复。回复应该自然、友好，长度在 20-100 字之间。只返回回复内容本身。`,
      },
      {
        role: 'user',
        content: `收到的评论：${commentContent}`,
      },
    ];
    const response = await this.callAPI(messages);
    return response.content.trim();
  }

  async generateMessage(
    conversationHistory: AIMessage[],
    personality: string,
  ): Promise<string> {
    this.logger.debug('OpenAI engine: generateMessage called');
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个社区用户，你的性格特点是：${personality}。请根据对话历史生成一条私信回复。回复应该自然、友好，长度在 30-150 字之间。只返回回复内容本身。`,
      },
      ...conversationHistory,
    ];
    const response = await this.callAPI(messages);
    return response.content.trim();
  }

  async rewriteContent(
    originalContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('OpenAI engine: rewriteContent called');
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个技术内容编辑，你的风格特点是：${personality}。请将以下 RSS 内容改写为一篇完整的社区帖子。要求：
1. 添加【摘要】部分，概括核心内容（50-100字）
2. 保留正文主要内容
3. 添加【分析与思考】部分，给出你的观点和见解（100-200字）
4. 使用 Markdown 格式
5. 语言流畅自然`,
      },
      {
        role: 'user',
        content: `请改写以下内容：\n\n${originalContent.substring(0, 3000)}`,
      },
    ];
    const response = await this.callAPI(messages);
    return response.content.trim();
  }
}
