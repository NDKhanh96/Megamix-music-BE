import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { generateSecret, totp, type GeneratedSecret } from 'speakeasy';
import type { LoginDto } from 'src/auth/dto';
import { RefreshToken } from 'src/auth/entities';
import type { JwtPayload, LoginAppMFA, LoginJwt } from 'src/types';
import type { CreateUserDto } from 'src/users/dto';
import type { User } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';
import type { EnvFileVariables } from 'src/utils/environment';
import { MoreThanOrEqual, type Repository, type UpdateResult } from 'typeorm';
import { v4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService<EnvFileVariables, true>,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Cần thêm {isCredential?: boolean} để dành cho trường hợp đăng nhập bằng google.
     * Tuy nhiên CreateUserDto còn dùng để validate, mà ta thì không muốn đăng nhập credential có thể gửi cả isCredential,
     * vậy nên kiểu dữ liệu phải là CreateUserDto & {isCredential?: boolean}
     */
    async register(userDTO: CreateUserDto & {isCredential?: boolean}): Promise<User> {
        return this.usersService.create(userDTO);
    }

    async login(loginDTO: LoginDto): Promise<LoginAppMFA | LoginJwt> {
        const { email, password } = loginDTO;
        const user: User | null = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch: boolean = await compare(password, user.password);

        if (!passwordMatch) {
            throw new UnauthorizedException('Wrong email or password');
        }

        if (user.enableAppMFA && user.appMFASecret) {
            return this.generateAppMFAUrl();
        }

        return this.generateUserTokens(user.email, user.id);
    }

    async googleLogin(req: Express.AuthenticatedRequest): Promise<LoginAppMFA | LoginJwt> {
        const { firstName, lastName, picture, email } = req.user;
        let user: User | null = await this.usersService.findOneByEmail(email);

        if (!user) {
            user = await this.register({
                firstName: firstName ?? '',
                lastName: lastName ?? '',
                picture: picture ?? '',
                email,
                password: '',
                isCredential: false,
            });

            return this.generateUserTokens(user.email, user.id);
        }

        if (!user.isCredential) {
            await this.usersService.update(user.email, { firstName, lastName, picture, email });
        }

        return this.generateUserTokens(user.email, user.id);
    }

    async refreshToken(refreshToken: string): Promise<LoginJwt> {
        const token: RefreshToken | null = await this.refreshTokenRepository.findOne({
            where: {
                token: refreshToken,
                expiresAt: MoreThanOrEqual(new Date())
            }
        });

        if (!token) {
            throw new UnauthorizedException('Refresh Token Invalid');
        }
        const user: User | null = await this.usersService.findOneById(token.userId);

        if (!user) {
            throw new UnauthorizedException();
        }

        return this.generateUserTokens(user.email, user.id);
    }

    async enableAppMFA(userId: number): Promise<{secret: string}> {
        const user: User | null = await this.usersService.findOneById(userId);

        if (!user) {
            throw new UnauthorizedException();
        }

        if (user.enableAppMFA) {
            return { secret: user.appMFASecret };
        }
        const [error, secret] = generateSecret.bind(this).toSafe<GeneratedSecret>();

        if (!secret) {
            const message: string = error instanceof Error ? error.message : 'Error while generating secret key';

            throw new ServiceUnavailableException(message);
        }

        user.appMFASecret = secret.base32;
        await this.usersService.updateSecretKey(user.id, user.appMFASecret);

        return { secret: user.appMFASecret };
    }

    async validateAppMFAToken(userId: number, token: string): Promise<{ verified: boolean }> {
        const user: User | null = await this.usersService.findOneById(userId);

        if (!user) {
            throw new UnauthorizedException();
        }
        const verified: boolean = totp.verify({
            secret: user.appMFASecret,
            encoding: 'base32',
            token,
        });

        return { verified: verified };
    }

    async disableAppMFA(userId: number): Promise<UpdateResult> {
        return this.usersService.disableAppMFA(userId);
    }

    generateAppMFAUrl(): LoginAppMFA {
        const baseUrl: string = this.configService.get('BASE_URL', { infer: true });

        return {
            validateAppMFA: `${baseUrl}/auth/appMFA/validate`,
            message: 'Please login by validating the appMFA token.',
        };
    }

    async generateUserTokens(userEmail: string, userId: number): Promise<LoginJwt> {
        const payload: JwtPayload = {
            email: userEmail,
            sub: userId,
        };
        const accessToken: string = this.jwtService.sign(payload);
        const refreshToken: string = v4();

        await this.storeRefreshToken(refreshToken, userId);

        return {
            accessToken,
            refreshToken,
        };
    }

    async storeRefreshToken(token: string, userId: number): Promise<void> {
        const REFRESH_TOKEN_EXPIRES_IN: string = this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true });
        const expiresDays: number = parseInt(REFRESH_TOKEN_EXPIRES_IN, 10);
        const expiresAt = new Date();

        expiresAt.setDate(expiresAt.getDate() + expiresDays);
        await this.refreshTokenRepository.delete({ userId: userId });
        await this.refreshTokenRepository.save({ token, userId, expiresAt });
    }
}
