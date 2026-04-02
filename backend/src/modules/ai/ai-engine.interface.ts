export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AIEngine {
  name: string;
  generate(messages: AIMessage[]): Promise<AIResponse>;
  generateTitle(content: string): Promise<string>;
  generateComment(
    postTitle: string,
    postContent: string,
    personality: string,
  ): Promise<string>;
  generateReply(commentContent: string, personality: string): Promise<string>;
  generateMessage(
    conversationHistory: AIMessage[],
    personality: string,
  ): Promise<string>;
  rewriteContent(
    originalContent: string,
    personality: string,
  ): Promise<string>;
}
