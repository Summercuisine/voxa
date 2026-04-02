import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LikesModule } from './modules/likes/likes.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { BotSchedulerModule } from './modules/bot-scheduler/bot-scheduler.module';
import { AIModule } from './modules/ai/ai.module';
import { BotsModule } from './modules/bots/bots.module';
import { RssModule } from './modules/rss/rss.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    CategoriesModule,
    LikesModule,
    MessagesModule,
    NotificationsModule,
    UploadModule,
    BotSchedulerModule,
    AIModule,
    BotsModule,
    RssModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
