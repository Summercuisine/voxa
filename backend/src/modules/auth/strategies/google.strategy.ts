import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const baseUrl = configService.get<string>('BASE_URL', 'http://localhost:3000');
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${baseUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    return {
      provider: 'google',
      providerId: profile.id,
      username: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || '',
      name: profile.displayName,
    };
  }
}
