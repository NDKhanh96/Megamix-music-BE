/**
 * Cần chạy function này trước tất cả import để test dc các hàm toSafe.
 */
addToSafe();

import { MailerService } from '@nestjs-modules/mailer';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { RefreshToken } from 'src/auth/entities';
import type { LoginAppMFA, LoginJwt } from 'src/types';
import type { User } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';
import type { Repository, UpdateResult } from 'typeorm';

const mockUserInfo = {
    correctPassword: 'correctPassword',
};

const mockDto = {
    registerInfo: {
        correct: {
            firstName: 'Khanh',
            lastName: 'Nguyen',
            email: '123@gmail.com',
            password: '123456',
            confirmPassword: '123456',
            picture: 'picture',
        },
    },
    loginInfo: {
        correct: {
            jwtMethod: {
                email: 'correctEmail@gmail.com',
                password: mockUserInfo.correctPassword,
            },
            appMFAMethod: {
                email: 'correctEmailAppMFA@gmail.com',
                password: mockUserInfo.correctPassword,
            },
        },
        wrong: {
            emailInfo: {
                email: '123@gmail.com',
                password: mockUserInfo.correctPassword,
            },
            passwordInfo: {
                email: 'correctEmail@gmail.com',
                password: '123456',
            },
        },
    },
    user: {
        disableAppMFA: {
            id: 1,
            firstName: 'Khanh',
            lastName: 'Nguyen',
            email: 'correctEmail@gmail.com',
            password: mockUserInfo.correctPassword,
            picture: 'picture',
            enableAppMFA: false,
            appMFASecret: 'secret',
            isCredential: false,
        },
        enableAppMFA: {
            id: 2,
            firstName: 'Khanh1',
            lastName: 'Nguyen1',
            email: 'correctEmailAppMFA@gmail.com',
            password: mockUserInfo.correctPassword,
            picture: 'picture',
            enableAppMFA: true,
            appMFASecret: 'secret',
            isCredential: false,
        },
    },
};

const mockRequest = {
    refreshToken: {
        correct : {
            refreshToken: 'correct refresh token',
        },
        wrong: {
            tokenInvalid: {
                refreshToken: 'wrong refresh token',
            },
            userIdInvalid: {
                refreshToken: 'wrong user id in token',
            },
            expiresToken: {
                refreshToken: 'expires refresh token'
            }
        },
    },
    userExist: {
        id: 1,
        firstName: 'john',
        lastName: 'doe',
        picture: 'picture',
        email: 'correctEmail@gmail.com',
    },
    userNotFound: {
        id: 1,
        firstName: 'john',
        lastName: 'doe',
        picture: 'picture',
        email: 'notfound@gmail.com',
    },
};

const mockResponse = {
    loginJwt: {
        accessToken: 'mock access token',
        refreshToken: 'mock refresh token',
    },
    loginAppMFA: {
        message: 'Please login by validating the appMFA token.',
        validateAppMFA: 'http://localhost:8080/auth/appMFA/validate',
    },
    disableAppMFA: {
        generatedMaps: [],
        raw: [],
        affected: 1,
    },
};

const mockRefreshTokenRepository = {
    findOne: {
        correct: {
            id: 10,
            userId: 1,
            token: 'this is mock refresh token',
            expiresAt: new Date(),
            user: {
                email: '',
                id: 1,
            }
        },
        wrong: {
            tokenInvalid: {
                id: 10,
                userId: 1,
                token: 'this is invalid mock refresh token',
                expiresAt: new Date(),
            },
            userIdInvalid: {
                id: 10,
                userId: 7777,
                token: 'this is mock refresh token',
                expiresAt: new Date(),
            },
        }
    },
    delete: {
        accessToken: 'this is mock access token',
        refreshToken: 'this is mock refresh token',
    },
    save: {
        secret: 'O5YE2SLLMFWFCORYM5PEKLRIEM4XS4KOKRSCKYS2PITEINB7IBKA',
    },
};

jest.mock('bcrypt',
    (): { compare: jest.Mock } => ({
        compare: jest.fn().mockImplementation((password: string, hashedPassword: string = mockUserInfo.correctPassword,): boolean => {
            if (password === hashedPassword) {
                return true;
            }

            return false;
        }),
    }),
);

jest.mock('uuid', (): { v4: jest.Mock } => ({
    v4: jest.fn().mockReturnValue('mock refresh token'),
}));

jest.mock('speakeasy', (): {generateSecret: jest.Mock, totp: {verify: jest.Mock}} => ({
    generateSecret: (jest.fn().mockReturnValue({ base32: 'speakeasy generateSecret' })),
    totp: {
        verify: (jest.fn().mockReturnValue(true)),
    },
}));

describe('AuthService', (): void => {
    let authService: AuthService;
    let usersService: UsersService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let refreshTokenRepository: Repository<RefreshToken>;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            /**
             * Inject các dependency cần thiết cho service để khởi tạo testing module.
             * Cách nhận biết các dependency cần thiết là dựa vào constructor của service.
             * Như ví dụ này, AuthService cần 4 dependency: RefreshToken, UsersService, ConfigService, JwtService
             */
            providers: [
                /**
                 * Vì đang viết test cho AuthService nên cần import AuthService .
                 */
                AuthService,
                /**
                 * Vì không cần test UsersService, ConfigService, JwtService nên thay vì import từ module thật, ta sẽ giả lập chúng.
                 */
                {
                    provide: UsersService,
                    useValue: {
                        create: jest.fn().mockResolvedValue(mockDto.registerInfo.correct),
                        findOneById: jest.fn().mockImplementation((id: number): User | null => {
                            if (id === mockDto.user.disableAppMFA.id) {
                                return mockDto.user.disableAppMFA as User;
                            }

                            if (id === mockDto.user.enableAppMFA.id) {
                                return mockDto.user.enableAppMFA as User;
                            }

                            return null;
                        }),
                        findOneByEmail: jest.fn().mockImplementation((email: string): User | null => {
                            if (email === mockDto.user.disableAppMFA.email) {
                                return mockDto.user.disableAppMFA as User;
                            }

                            if (email === mockDto.user.enableAppMFA.email) {
                                return mockDto.user.enableAppMFA as User;
                            }

                            return null;
                        }),
                        update: jest.fn().mockResolvedValue(mockResponse.disableAppMFA),
                        updateSecretKey: jest.fn().mockResolvedValue(undefined),
                        disableAppMFA: jest.fn().mockResolvedValue(mockResponse.disableAppMFA),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string): 'http://localhost:8080' | '1d' | undefined => {
                            if (key === 'BASE_URL') {
                                return 'http://localhost:8080';
                            }

                            if (key === 'REFRESH_TOKEN_EXPIRES_IN') {
                                return '1d';
                            }
                        }),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock access token'),
                    },
                },
                /**
                 * Vì quá trình test không kết nối đến database thật nên các method của repository sẽ không hoạt động.
                 * Vậy nên ta cần giả lập repository bằng cách mock nó.
                 */
                {
                    /**
                     * Tên của repository cần mock phải trùng với tên của repository thật.
                     */
                    provide: getRepositoryToken(RefreshToken),
                    /**
                     * Thêm các method mock với tên giống với method của refreshTokenRepository thật.
                     */
                    useValue: {
                        findOne: jest.fn().mockImplementation(({ where: { token: refreshToken } }: { where: { token: string } }): RefreshToken | null => {
                            if (refreshToken === mockRequest.refreshToken.correct.refreshToken) {
                                return mockRefreshTokenRepository.findOne.correct as RefreshToken;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.tokenInvalid.refreshToken) {
                                return null;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.userIdInvalid.refreshToken) {
                                return mockRefreshTokenRepository.findOne.wrong.userIdInvalid as RefreshToken;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.expiresToken.refreshToken) {
                                return null;
                            }

                            return null;
                        }),
                        delete: jest.fn().mockResolvedValue(mockRefreshTokenRepository.delete),
                        save: jest.fn().mockResolvedValue(mockRefreshTokenRepository.save),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn().mockResolvedValue([null, 'mock result']),
                    },
                }
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        configService = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
        refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    });

    it('should be defined', (): void => {
        expect(authService).toBeDefined();
        expect(usersService).toBeDefined();
        expect(configService).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(refreshTokenRepository).toBeDefined();
    });

    /**
     * Test những method của AuthService.
     * Lưu ý rằng khác với thực tế là AuthService sử dụng các service gốc của UserService, ConfigService,..
     * thì jest lại khiến AuthService sử dụng những method mock ở providers được viết ở trên.
     */

    describe('Method: register', (): void => {
        it('should create a user', async (): Promise<void> => {
            const user: User = await authService.register(mockDto.registerInfo.correct);

            expect(user).toEqual(mockDto.registerInfo.correct);
        });
    });

    describe('Method: login', (): void => {
        it('should login success jwt', async (): Promise<void> => {
            const response: LoginAppMFA | LoginJwt = await authService.login(mockDto.loginInfo.correct.jwtMethod);

            expect(response).toEqual(mockResponse.loginJwt);
        });

        it('should login success with user enable appMFA', async (): Promise<void> => {
            const response: LoginAppMFA | LoginJwt = await authService.login(mockDto.loginInfo.correct.appMFAMethod);

            expect(response).toEqual(mockResponse.loginAppMFA);
        });

        it('should throw UnauthorizedException login with wrong email', async (): Promise<void> => {
            const fn: Promise<LoginAppMFA | LoginJwt> = authService.login(mockDto.loginInfo.wrong.emailInfo);

            await expect(fn).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
        });

        it('should throw UnauthorizedException login fail with wrong password', async (): Promise<void> => {
            const fn: Promise<LoginAppMFA | LoginJwt> = authService.login(mockDto.loginInfo.wrong.passwordInfo);

            await expect(fn).rejects.toThrow(new UnauthorizedException('Wrong email or password'));
        });
    });

    describe('Method: googleLogin', (): void => {
        it('should register success with new google account', async (): Promise<void> => {
            const response: LoginAppMFA | LoginJwt = await authService.googleLogin({ user: mockRequest.userExist }  as Express.AuthenticatedRequest);

            expect(response).toEqual(mockResponse.loginJwt);
        });

        it('should login and update success with existing google account', async (): Promise<void> => {
            const response: LoginAppMFA | LoginJwt = await authService.googleLogin({ user: mockRequest.userNotFound }  as Express.AuthenticatedRequest);

            expect(response).toEqual(mockResponse.loginJwt);
        });
    });

    describe('Method: refreshToken', (): void => {
        it('should refresh token success', async (): Promise<void> => {
            const loginJwt: LoginJwt = await authService.refreshToken(mockRequest.refreshToken.correct.refreshToken);

            expect(loginJwt).toEqual(mockResponse.loginJwt);
        });

        it('should throw UnauthorizedException when wrong refresh token', async (): Promise<void> => {
            const fn: Promise<LoginJwt> = authService.refreshToken(mockRequest.refreshToken.wrong.tokenInvalid.refreshToken);

            await expect(fn).rejects.toThrow(new UnauthorizedException('Refresh Token Invalid'));
        });

        it('should throw UnauthorizedException with expires refresh token', async (): Promise<void> => {
            const fn: Promise<LoginJwt> = authService.refreshToken(mockRequest.refreshToken.wrong.expiresToken.refreshToken);

            await expect(fn).rejects.toThrow(new UnauthorizedException('Refresh Token Invalid'));
        });
    });

    describe('Method: enableAppMFA', (): void => {
        it('should enableAppMFA success with user was disabled appMFA', async (): Promise<void> => {
            const secret: {secret: string} = await authService.enableAppMFA(mockDto.user.disableAppMFA.id);

            expect(secret).toEqual({ secret: 'speakeasy generateSecret' });
        });

        it('should throw UnauthorizedException with userId not found', async (): Promise<void> => {
            const fn: Promise<{secret: string}> = authService.enableAppMFA(7777);

            await expect(fn).rejects.toThrow(new UnauthorizedException());
        });

        it('should return old appMFA secret with user enable appMFA already', async (): Promise<void> => {
            const secret: {secret: string} = await authService.enableAppMFA(mockDto.user.enableAppMFA.id);

            expect(secret).toEqual({ secret: 'secret' });
        });
    });

    describe('Method: validateAppMFAToken', (): void => {
        it('should validateAppMFA success', async (): Promise<void> => {
            const result: {verified: boolean} = await authService.validateAppMFAToken(mockDto.user.enableAppMFA.id, '123456');

            expect(result).toEqual({ verified: true });
        });

        it('should throw UnauthorizedException with userId not found', async (): Promise<void> => {
            const fn: Promise<{verified: boolean}> = authService.validateAppMFAToken(7777, '123456');

            await expect(fn).rejects.toThrow(new UnauthorizedException());
        });
    });

    describe('Method: disableAppMFA', (): void => {
        it('should disable appMFA success', async (): Promise<void> => {
            const result: UpdateResult = await authService.disableAppMFA(7777);

            expect(result).toEqual(mockResponse.disableAppMFA);
        });
    });

    describe('Method: generateAppMFAUrl', (): void => {
        it('should throw UnauthorizedException with userId not found', async (): Promise<void> => {
            const result: LoginAppMFA = authService.generateAppMFAUrl();

            expect(result).toEqual(mockResponse.loginAppMFA);
        });
    });

    describe('Method: generateUserTokens', (): void => {
        it('should generate user token success', async (): Promise<void> => {
            const result: LoginJwt = await authService.generateUserTokens('123@gmail.com', 7777);

            expect(result).toEqual(mockResponse.loginJwt);
        });
    });

    describe('Method: storeRefreshToken', (): void => {
        it('should store refresh token without throwing an error', async (): Promise<void> => {
            await expect(authService.storeRefreshToken('this is mock refresh token', 7777)).resolves.not.toThrow();
        });
    });
});

function addToSafe () {
    const originMock: typeof jest.fn = jest.fn;

    jest.fn = (...args: Parameters<typeof originMock>): ReturnType<typeof originMock> & { toSafe?: <T>(...args: unknown[]) => [unknown, null] | [null, T] } => {
        const mockFn: jest.Mock = originMock(...args);

        mockFn.toSafe = function <T>(...args: unknown[]): [unknown, null] | [null, T] {
            try {
                const result: T = this(...args);

                return [null, result];
            } catch (error: unknown) {
                return [error, null];
            }
        };
        const originalBind: typeof mockFn.bind = mockFn.bind;

        mockFn.bind = function (thisArg: unknown, ...bindArgs: unknown[]): jest.Mock & { toSafe?: <T>(...args: unknown[]) => [unknown, null] | [null, T] } {
            const boundFn: jest.Mock = originalBind.apply(this, [thisArg, ...bindArgs]);

            boundFn.toSafe = this.toSafe;

            return boundFn;
        };

        return mockFn;
    };
}
