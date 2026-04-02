import { Module } from '@nestjs/common';
import { BotsService } from './bots.service.js';
import { BotsController } from './bots.controller.js';
import { AIModule } from '../ai/ai.module.js';

@Module({
  imports: [AIModule],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
