import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const baseUrl = configService.get<string>('BASE_URL', 'http://localhost:3000');
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${baseUrl}/api/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    return {
      provider: 'github',
      providerId: profile.id.toString(),
      username: profile.username,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || '',
      name: profile.displayName || profile.username,
    };
  }
}
