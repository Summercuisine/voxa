import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('系统')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }
}
