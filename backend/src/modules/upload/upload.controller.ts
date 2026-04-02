import {
  Controller,
  Post,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('文件上传')
@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('api/upload/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传图片' })
  async uploadImage(@Req() req: FastifyRequest) {
    const multipartData = await req.file();
    if (!multipartData) {
      throw new BadRequestException('请上传文件');
    }

    const result = await this.uploadService.uploadFile(multipartData);
    return result;
  }
}
