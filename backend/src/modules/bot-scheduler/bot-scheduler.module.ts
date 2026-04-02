import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BotSchedulerService } from './bot-scheduler.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AIModule,
  ],
  providers: [BotSchedulerService],
  exports: [BotSchedulerService],
})
export class BotSchedulerModule {}
