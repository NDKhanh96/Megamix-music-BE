import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { RefreshToken } from 'src/auth/entities';
import { GoogleStrategy, JwtStrategy } from 'src/auth/strategies';
import { User } from 'src/users/entities';
import { UsersModule } from 'src/users/users.module';
import { MailerServiceModule } from 'src/utils/configs/mailerService';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken]),
        UsersModule,
        ConfigModule,
        MailerServiceModule
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
