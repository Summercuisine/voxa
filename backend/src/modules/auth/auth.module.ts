import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { GithubStrategy } from './strategies/github.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { GamificationModule } from '../gamification/gamification.module.js';
import { BadgesModule } from '../badges/badges.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as StringValue,
        },
      }),
    }),
    GamificationModule,
    BadgesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GithubStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
