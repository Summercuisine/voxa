import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MessagesModule } from './modules/messages/messages.module';
import { BotSchedulerModule } from './modules/bot-scheduler/bot-scheduler.module';
import { AIModule } from './modules/ai/ai.module';
import { BotsModule } from './modules/bots/bots.module';
import { RssModule } from './modules/rss/rss.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    PostsModule,
    CommentsModule,
    CategoriesModule,
    MessagesModule,
    BotSchedulerModule,
    AIModule,
    BotsModule,
    RssModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
