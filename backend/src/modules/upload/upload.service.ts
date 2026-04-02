import { Injectable, BadRequestException } from '@nestjs/common';
import { MultipartFile } from '@fastify/multipart';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: MultipartFile): Promise<{ url: string }> {
    const mimeType = file.mimetype;

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `不支持的文件类型: ${mimeType}，仅支持 jpeg, png, gif, webp`,
      );
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;

    for await (const chunk of file.file) {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) {
        throw new BadRequestException('文件大小超过 5MB 限制');
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const ext = MIME_TO_EXT[mimeType] || 'bin';
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${randomString}.${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, buffer);

    return { url: `/uploads/${filename}` };
  }

  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(this.uploadDir, filename);
    try {
      await fs.promises.unlink(filepath);
    } catch {
      // 文件不存在时忽略错误
    }
  }
}
