import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy } from 'passport-google-oauth20';
import type { VerifiedCallback } from 'passport-jwt';
import type { EnvFileVariables } from 'src/utils/environment';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly configService: ConfigService<EnvFileVariables, true>,
    ) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET', { infer: true }),
            callbackURL: `${configService.get('BASE_URL', { infer: true })}/api/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifiedCallback): Promise<void> {
        const { email, given_name, family_name, picture } = profile._json;

        const user = {
            email: email,
            firstName: given_name,
            lastName: family_name,
            picture: picture,
            accessToken,
        };

        done(null, user);
    }
}
