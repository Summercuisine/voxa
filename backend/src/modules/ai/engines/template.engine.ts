import { Injectable, Logger } from '@nestjs/common';
import { AIEngine, AIMessage, AIResponse } from '../ai-engine.interface.js';

@Injectable()
export class TemplateEngine implements AIEngine {
  private readonly logger = new Logger(TemplateEngine.name);
  readonly name = 'template';

  // ==================== 标题模板库 ====================
  private readonly titleTemplates = [
    '深度解析：{keyword} 的核心原理与实践',
    '{keyword} 最新动态：你需要知道的一切',
    '从零到一：{keyword} 完全指南',
    '{keyword} 前沿趋势：2025 年度回顾与展望',
    '为什么 {keyword} 正在改变整个行业格局？',
    '{keyword} 实战经验分享：踩过的坑与收获',
    '一文读懂 {keyword}：入门到精通的进阶之路',
    '{keyword} 技术选型指南：如何做出最优选择',
    '探索 {keyword} 的无限可能：创新应用场景盘点',
    '{keyword} 最佳实践：来自一线开发者的经验总结',
    '重新定义 {keyword}：下一代技术范式转移',
    '{keyword} 深度对比：主流方案全面评测',
    '手把手教你掌握 {keyword}：从概念到落地',
    '{keyword} 背后的故事：技术演进与未来方向',
    '关于 {keyword}，90% 的人可能都理解错了',
  ];

  // ==================== 评论模板库 ====================
  private readonly commentTemplates = [
    '写得太好了！关于 {topic} 这个观点非常有启发性，之前一直没从这个角度思考过。',
    '感谢分享！我在实际项目中也遇到过类似的问题，{topic} 确实是个值得深入研究的方向。',
    '这篇文章的深度很不错，特别是关于 {topic} 的部分。不过我觉得还可以补充一些实际案例。',
    '非常认同作者的观点！{topic} 是当前行业的热点，期待更多这方面的深度内容。',
    '干货满满！{topic} 这个话题写的人不少，但能写到这个深度的确实不多。',
    '作为一个 {topic} 领域的从业者，我觉得这篇文章总结得很到位，收藏了！',
    '好文！不过关于 {topic} 的部分，我有一些不同的看法，有机会可以深入讨论一下。',
    '终于看到有人把 {topic} 讲得这么清楚了，之前看了好多资料都没搞明白。',
    '这篇文章让我对 {topic} 有了全新的认识，特别是文中提到的几个关键点，非常受用。',
    '分享得非常及时！最近正好在研究 {topic}，这篇文章提供了很好的参考。',
    '这个角度很新颖！{topic} 的分析很有深度，期待作者出个系列文章。',
    '实用性强！{topic} 相关的内容很多都是理论，这篇文章给出了可落地的方案。',
    '看完这篇文章，感觉对 {topic} 的理解又上了一个台阶，感谢作者的用心分享。',
    '文章质量很高，{topic} 的分析逻辑清晰，论据充分，值得反复阅读。',
  ];

  // ==================== 回复模板库 ====================
  private readonly replyTemplates = [
    '谢谢你的反馈！你说得很有道理，关于这个点我确实需要再深入思考一下。',
    '感谢补充！你提到的这个角度我之前确实忽略了，回头我会进一步研究。',
    '很高兴我的分享对你有帮助！如果有什么问题，随时可以继续交流。',
    '你的观点很有启发性，这正是技术讨论的魅力所在——不同视角的碰撞。',
    '完全同意！这个领域还有很多值得探索的地方，期待后续能一起讨论更多话题。',
    '谢谢你的认可！其实这个话题还有很多可以展开的地方，后续我会继续更新。',
    '你说得对，这个方面确实需要更多的实践经验来验证。感谢指出！',
    '非常感谢你的详细反馈！这对我后续的内容创作很有帮助。',
    '哈哈，看来我们在这个问题上的看法很一致！有机会可以一起做些有趣的项目。',
    '感谢你的不同看法！技术领域本来就需要多元化的声音，这样才能推动进步。',
    '好问题！这个确实值得深入探讨，我后续会专门写一篇来分析这个问题。',
    '谢谢你的关注！保持学习的心态是最重要的，一起进步吧。',
    '你的经验很丰富啊！有机会的话希望能多交流，互相学习。',
    '完全理解你的想法，这确实是业界普遍关注的一个问题。',
  ];

  // ==================== 私信模板库 ====================
  private readonly messageTemplates = [
    '你好！很高兴收到你的消息。关于你提到的内容，我觉得非常有意思，我们可以深入聊聊。',
    '嗨！感谢你的关注。有什么我可以帮到你的吗？随时欢迎交流技术话题。',
    '你好呀！最近在研究一些新的技术方向，如果你也感兴趣的话，可以一起探讨。',
    '收到你的消息了！关于这个话题，我最近刚好有一些新的想法，想和你分享一下。',
    '你好！很高兴认识你。技术这条路，多交流多分享才能走得更远。',
    '嗨！你的问题我看到了，让我想想怎么更好地回答你。稍等一下哦。',
    '你好！感谢你的来信。作为一个技术爱好者，我非常乐意和你讨论任何技术话题。',
    '很高兴收到你的消息！最近社区里有很多有趣的讨论，你有参与吗？',
    '你好！你的观点很有深度，这正是我一直在思考的问题。我们可以约个时间详细聊聊。',
    '嗨！欢迎随时来交流，技术社区需要更多像你这样积极思考的人。',
    '你好！最近在忙什么有趣的项目呢？如果有什么需要帮忙的，尽管说。',
    '收到！你的想法很有创意，我觉得可以进一步探讨实现的可行性。',
    '你好！很高兴能和你交流。技术世界很大，我们一起探索吧！',
    '嗨！感谢你的信任。关于你说的这个方向，我有一些资源可以分享给你。',
  ];

  // ==================== 改写模板库 ====================
  private readonly rewriteTemplates = [
    '【摘要】{summary}\n\n【核心观点】{content}\n\n【分析与思考】这篇文章深入探讨了相关话题，从多个维度进行了分析。作者的观点独到且具有前瞻性，值得认真研读和思考。',
    '【内容速览】{summary}\n\n{content}\n\n【小编点评】这是一篇非常有价值的文章，不仅提供了丰富的信息，还给出了深刻的见解。推荐对相关领域感兴趣的朋友仔细阅读。',
    '【要点提炼】{summary}\n\n【详细内容】{content}\n\n【延伸思考】从这篇文章中，我们可以看到行业发展的新趋势。技术的进步正在重塑我们的工作和生活方式，保持学习至关重要。',
    '【核心摘要】{summary}\n\n{content}\n\n【深度解读】这篇文章从实践角度出发，分享了宝贵的经验。对于正在相关领域探索的开发者来说，具有很强的参考价值。',
    '【快速导读】{summary}\n\n{content}\n\n【观点提炼】作者的观点切中要害，分析深入浅出。这篇文章不仅提供了知识，更激发了思考。建议收藏反复阅读。',
    '【内容概要】{summary}\n\n{content}\n\n【专业点评】该文逻辑清晰，论证充分，是一篇难得的深度好文。推荐关注相关领域的读者认真研读。',
    '【精华提取】{summary}\n\n{content}\n\n【思考与启示】这篇文章提供了独特的视角和深入的分析，对于理解当前技术趋势具有重要的参考意义。',
    '【摘要总结】{summary}\n\n{content}\n\n【编者按】本文内容详实，观点鲜明，是一篇值得推荐的好文章。希望读者能从中获得启发和收获。',
    '【核心要点】{summary}\n\n{content}\n\n【深度分析】从专业角度来看，这篇文章涵盖了该领域的关键知识点，并提供了独到的见解，适合各个层次的读者。',
    '【内容精要】{summary}\n\n{content}\n\n【综合评价】这篇文章兼具理论深度和实践指导意义，是不可多得的技术好文。强烈推荐阅读。',
  ];

  private randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const techTerms = [
      'AI', 'GPT', 'LLM', 'React', 'Vue', 'Node.js', 'Python', 'TypeScript',
      'Kubernetes', 'Docker', '微服务', '云原生', 'DevOps', '机器学习',
      '深度学习', '前端', '后端', '全栈', '架构', '性能优化', '数据库',
      'Redis', 'GraphQL', 'REST', 'API', '安全', '加密', '区块链',
      'Web3', 'Rust', 'Go', 'Swift', 'Flutter', '开源', 'Linux',
      '算法', '数据结构', '设计模式', '敏捷开发', 'CI/CD', '自动化',
      '监控', '日志', '分布式', '高并发', '低代码', 'SaaS', '产品',
      '创业', '融资', '增长', 'Figma', 'UI', 'UX', '设计系统',
    ];

    for (const term of techTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        keywords.push(term);
      }
    }

    if (keywords.length === 0) {
      const words = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '').split(/\s+/);
      keywords.push(...words.slice(0, 3).filter((w) => w.length > 1));
    }

    return keywords.length > 0 ? keywords : ['技术', '开发', '编程'];
  }

  private generateSummary(content: string): string {
    const sentences = content
      .replace(/<[^>]*>/g, '')
      .split(/[。！？\n]+/)
      .filter((s) => s.trim().length > 5);

    if (sentences.length === 0) return content.substring(0, 100);
    if (sentences.length <= 2) return sentences.join('。');

    const picked: string[] = [];
    const indices = [0, Math.floor(sentences.length / 2), sentences.length - 1];
    for (const idx of indices) {
      if (sentences[idx]) {
        picked.push(sentences[idx].trim());
      }
    }

    return picked.join('。') + '。';
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    this.logger.debug('Template engine: generate called');
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const content = lastUserMsg?.content || '你好';
    const keywords = this.extractKeywords(content);
    const keyword = this.randomPick(keywords);

    const response = this.randomPick([
      `关于 ${keyword} 这个话题，我有以下看法：这是一个非常值得深入探讨的领域。从技术发展的角度来看，${keyword} 正在经历快速的演进，未来可期。`,
      `感谢你的提问！${keyword} 确实是一个热门话题。根据我的了解，这个领域有很多值得关注的进展和趋势。`,
      `好问题！${keyword} 是我一直在关注的领域。让我从几个方面来分析一下这个问题。`,
    ]);

    return {
      content: response,
      model: 'template',
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }

  async generateTitle(content: string): Promise<string> {
    this.logger.debug('Template engine: generateTitle called');
    const keywords = this.extractKeywords(content);
    const keyword = this.randomPick(keywords);
    const template = this.randomPick(this.titleTemplates);
    return template.replace('{keyword}', keyword);
  }

  async generateComment(
    postTitle: string,
    postContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('Template engine: generateComment called');
    const allText = `${postTitle} ${postContent}`;
    const keywords = this.extractKeywords(allText);
    const topic = this.randomPick(keywords);
    const template = this.randomPick(this.commentTemplates);
    return template.replace('{topic}', topic);
  }

  async generateReply(
    commentContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('Template engine: generateReply called');
    return this.randomPick(this.replyTemplates);
  }

  async generateMessage(
    conversationHistory: AIMessage[],
    personality: string,
  ): Promise<string> {
    this.logger.debug('Template engine: generateMessage called');
    const lastMsg = [...conversationHistory].reverse().find((m) => m.role === 'user');
    if (lastMsg) {
      const keywords = this.extractKeywords(lastMsg.content);
      if (keywords.length > 0) {
        const topic = this.randomPick(keywords);
        const template = this.randomPick(this.messageTemplates);
        return template.replace('{topic}', topic);
      }
    }
    return this.randomPick(this.messageTemplates);
  }

  async rewriteContent(
    originalContent: string,
    personality: string,
  ): Promise<string> {
    this.logger.debug('Template engine: rewriteContent called');
    const cleanContent = originalContent.replace(/<[^>]*>/g, '').trim();
    const summary = this.generateSummary(cleanContent);
    const contentSnippet =
      cleanContent.length > 500
        ? cleanContent.substring(0, 500) + '...'
        : cleanContent;
    const template = this.randomPick(this.rewriteTemplates);
    return template
      .replace('{summary}', summary)
      .replace('{content}', contentSnippet);
  }
}
