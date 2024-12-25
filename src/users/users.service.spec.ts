import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';
import type { Repository, UpdateResult } from 'typeorm';

const mockUserInfo = {
    correctPassword: 'correctPassword',
};

const mockDto = {
    user: {
        valid: {
            disableAppMFA: {
                id: 1,
                firstName: 'Khanh',
                lastName: 'Nguyen',
                email: 'correctEmail@gmail.com',
                password: mockUserInfo.correctPassword,
                picture: 'picture',
                enableAppMFA: false,
                appMFASecret: 'secret',
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
            },
        },
        notfound: {
            id: 3,
            firstName: 'notfound',
            lastName: 'notfound',
            email: 'notfound@gmail.com',
            password: mockUserInfo.correctPassword,
            confirmPassword: mockUserInfo.correctPassword,
            picture: 'picture',
            enableAppMFA: false,
            appMFASecret: '123445',
        },
    },
    createUserInfo: {
        alreadyExist: {
            firstName: 'user existed',
            lastName: 'user existed',
            email: 'userExist@gmail.com',
            picture: 'picture',
            password: 'password',
            confirmPassword: 'password',
        },
        notExist: {
            firstName: 'user not existed',
            lastName: 'user not existed',
            email: 'userNotExisted@gmail.com',
            picture: 'picture',
            password: '1',
            confirmPassword: '1',
        },
    }
};

const mockUserRepository = {
    findOne: mockDto.user.valid.disableAppMFA,
    save: mockDto.user.valid.disableAppMFA,
    update: {
        generatedMaps: [],
        raw: [],
        affected: 1,
    },
};

describe('UsersService', (): void => {
    let userService: UsersService;
    let userRepository: Repository<User>;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn((options) => {
                            if (options.where.id === mockDto.user.valid.disableAppMFA.id) {
                                return mockDto.user.valid.enableAppMFA;
                            } else if (options.where.email === mockDto.createUserInfo.alreadyExist.email) {
                                return mockDto.user.valid.disableAppMFA;
                            }

                            return null;
                        }),
                        save: jest.fn().mockResolvedValue(mockUserRepository.save),
                        update: jest.fn().mockResolvedValue(mockUserRepository.update),
                    },
                }
            ],
        }).compile();

        userService = module.get<UsersService>(UsersService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('should be defined', (): void => {
        expect(userService).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    describe('Method: create', (): void => {
        it('should create a user', async (): Promise<void> => {
            const response: User = await userService.create(mockDto.user.notfound);

            expect(response).toEqual(mockDto.user.valid.disableAppMFA);
        });

        it('should throw ConflictException when email already exist', async (): Promise<void> => {
            const fn: Promise<User> = userService.create(mockDto.createUserInfo.alreadyExist);

            await expect(fn).rejects.toThrow(new ConflictException('Email already exists'));
        });
    });

    describe('Method: findOneById', (): void => {
        it('should find a user', async (): Promise<void> => {
            const response: User | null = await userService.findOneById(mockDto.user.valid.disableAppMFA.id);

            expect(response).toEqual(mockDto.user.valid.enableAppMFA);
        });

        it('should not find a user', async (): Promise<void> => {
            const response: User | null = await userService.findOneById(mockDto.user.notfound.id);

            expect(response).toEqual(null);
        });
    });

    describe('Method: findOneByEmail', (): void => {
        it('should find a user', async (): Promise<void> => {
            const response: User | null = await userService.findOneByEmail(mockDto.createUserInfo.alreadyExist.email);

            expect(response).toEqual(mockDto.user.valid.disableAppMFA);
        });

        it('should not find a user', async (): Promise<void> => {
            const response: User | null = await userService.findOneByEmail(mockDto.user.notfound.email);

            expect(response).toEqual(null);
        });
    });

    describe('Method: update', (): void => {
        it('should update a user success', async (): Promise<void> => {
            const response: UpdateResult = await userService.update(mockDto.createUserInfo.alreadyExist.email, mockDto.createUserInfo.alreadyExist);

            expect(response).toEqual(mockUserRepository.update);
        });
    });

    describe('Method: updateSecretKey', (): void => {
        it('should update secret key without throwing an error', async (): Promise<void> => {
            await expect(userService.updateSecretKey(mockDto.user.valid.disableAppMFA.id, mockDto.user.valid.disableAppMFA.appMFASecret))
                .resolves.not.toThrow();
        });
    });

    describe('Method: disableAppMFA', (): void => {
        it('should disable appMFA without throwing an error', async (): Promise<void> => {
            await expect(userService.disableAppMFA(mockDto.user.valid.disableAppMFA.id)).resolves.not.toThrow();
        });
    });
});
