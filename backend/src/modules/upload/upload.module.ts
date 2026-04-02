import { Module, OnModuleInit } from '@nestjs/common';
import { FastifyInstance } from 'fastify';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule implements OnModuleInit {
  async onModuleInit() {
    // 静态文件服务将在 main.ts 中注册
  }
}
