import { Module } from '@nestjs/common';
import { BadgesController } from './badges.controller.js';
import { BadgesService } from './badges.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { GamificationModule } from '../gamification/gamification.module.js';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
