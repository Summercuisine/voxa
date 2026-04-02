import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';

@ApiTags('认证')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req: any) {
    return this.authService.validateUser(req.user.id);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth 重定向' })
  githubAuth() {
    // Passport 会自动重定向到 GitHub 授权页面
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth 回调' })
  async githubAuthCallback(@Request() req: any, @Res() res: FastifyReply) {
    const result = await this.authService.findOrCreateOAuthUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 重定向' })
  googleAuth() {
    // Passport 会自动重定向到 Google 授权页面
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 回调' })
  async googleAuthCallback(@Request() req: any, @Res() res: FastifyReply) {
    const result = await this.authService.findOrCreateOAuthUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }
}
