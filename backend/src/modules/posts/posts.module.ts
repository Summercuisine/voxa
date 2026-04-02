import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { GamificationModule } from '../gamification/gamification.module.js';
import { BadgesModule } from '../badges/badges.module.js';

@Module({
  imports: [GamificationModule, BadgesModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
