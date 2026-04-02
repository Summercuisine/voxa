import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface RssArticle {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
}

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchFeed(sourceUrl: string): Promise<RssArticle[]> {
    this.logger.log(`Fetching RSS feed: ${sourceUrl}`);

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'VoxaBot/1.0 (RSS Aggregator)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xml = await response.text();
      return this.parseXml(xml);
    } catch (error) {
      this.logger.error(`Failed to fetch feed ${sourceUrl}: ${error}`);
      throw error;
    }
  }

  parseXml(xml: string): RssArticle[] {
    const articles: RssArticle[] = [];
    const seenLinks = new Set<string>();

    // Detect feed type
    const isAtom = xml.includes('<feed') || xml.includes('<atom:feed');

    if (isAtom) {
      return this.parseAtom(xml, seenLinks, articles);
    }

    return this.parseRss(xml, seenLinks, articles);
  }

  private parseRss(xml: string, seenLinks: Set<string>, articles: RssArticle[]): RssArticle[] {
    // Extract items from RSS 2.0
    const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
    const itemMatches = xml.match(itemRegex);

    if (!itemMatches) {
      this.logger.warn('No items found in RSS feed');
      return articles;
    }

    for (const item of itemMatches) {
      const title = this.extractTag(item, 'title');
      const link = this.extractTag(item, 'link');
      const description =
        this.extractTag(item, 'description') ||
        this.extractTag(item, 'content:encoded') ||
        '';
      const pubDate = this.extractTag(item, 'pubDate');

      if (!link || seenLinks.has(link)) continue;
      seenLinks.add(link);

      articles.push({
        title: this.cleanText(title || '无标题'),
        link: this.cleanText(link),
        description: this.stripHtml(description),
        pubDate: pubDate ? new Date(pubDate).toISOString() : undefined,
      });
    }

    return articles;
  }

  private parseAtom(xml: string, seenLinks: Set<string>, articles: RssArticle[]): RssArticle[] {
    // Extract entries from Atom feed
    const entryRegex = /<entry[\s>][\s\S]*?<\/entry>/gi;
    const entryMatches = xml.match(entryRegex);

    if (!entryMatches) {
      this.logger.warn('No entries found in Atom feed');
      return articles;
    }

    for (const entry of entryMatches) {
      const title = this.extractTag(entry, 'title');
      let link = '';

      // Atom links use href attribute
      const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
      if (linkMatch) {
        link = linkMatch[1];
      } else {
        link = this.extractTag(entry, 'link') || '';
      }

      const description =
        this.extractTag(entry, 'summary') ||
        this.extractTag(entry, 'content') ||
        '';
      const pubDate =
        this.extractTag(entry, 'updated') ||
        this.extractTag(entry, 'published');

      if (!link || seenLinks.has(link)) continue;
      seenLinks.add(link);

      articles.push({
        title: this.cleanText(title || '无标题'),
        link: this.cleanText(link),
        description: this.stripHtml(description),
        pubDate: pubDate ? new Date(pubDate).toISOString() : undefined,
      });
    }

    return articles;
  }

  private extractTag(xml: string, tagName: string): string | null {
    // Handle namespaced tags like content:encoded
    const regex = new RegExp(
      `<(?:\\w+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tagName}>`,
      'i',
    );
    const match = xml.match(regex);
    if (match) {
      // Handle CDATA sections
      return match[1]
        .replace(/^<!\[CDATA\[/, '')
        .replace(/\]\]>$/, '')
        .trim();
    }
    return null;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async fetchAllSources(): Promise<{ source: any; articles: RssArticle[] }[]> {
    const sources = await this.prisma.rssSource.findMany({
      where: { isActive: true },
      include: { bot: true },
    });

    const results: { source: any; articles: RssArticle[] }[] = [];

    for (const source of sources) {
      try {
        const articles = await this.fetchFeed(source.url);
        results.push({ source, articles });

        // Update lastFetched
        await this.prisma.rssSource.update({
          where: { id: source.id },
          data: { lastFetched: new Date() },
        });

        this.logger.log(
          `Fetched ${articles.length} articles from ${source.name}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch source ${source.name}: ${error}`,
        );
        results.push({ source, articles: [] });
      }
    }

    return results;
  }

  async getSourcesByBot(botId: string) {
    const bot = await this.prisma.bot.findUnique({ where: { id: botId } });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    return this.prisma.rssSource.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSource(dto: {
    name: string;
    url: string;
    siteUrl?: string;
    description?: string;
    language?: string;
    botId: string;
  }) {
    const bot = await this.prisma.bot.findUnique({ where: { id: dto.botId } });

    if (!bot) {
      throw new NotFoundException('Bot 不存在');
    }

    return this.prisma.rssSource.create({
      data: {
        name: dto.name,
        url: dto.url,
        siteUrl: dto.siteUrl,
        description: dto.description,
        language: dto.language || 'zh',
        botId: dto.botId,
      },
    });
  }

  async removeSource(id: string) {
    const source = await this.prisma.rssSource.findUnique({ where: { id } });

    if (!source) {
      throw new NotFoundException('RSS 源不存在');
    }

    await this.prisma.rssSource.delete({ where: { id } });

    return { message: 'RSS 源已删除' };
  }
}
