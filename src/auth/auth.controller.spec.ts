import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import type { LoginAppMFA, LoginJwt } from 'src/types';
import type { User } from 'src/users/entities';
import type { UpdateResult } from 'typeorm';

const mockResponseData = {
    register: {
        firstName: 'Khanh',
        lastName: 'Nguyen',
        email: '1@gmail.com',
        appMFASecret: null,
        id: 10,
        enableAppMFA: false
    },
    loginAndRefreshToken: {
        accessToken: 'this is mock access token',
        refreshToken: 'this is mock refresh token',
    },
    enableAppMFA: {
        secret: 'O5YE2SLLMFWFCORYM5PEKLRIEM4XS4KOKRSCKYS2PITEINB7IBKA'
    },
    validateAppMFA: {
        verified: true
    },
    disableAppMFA: {
        generatedMaps: [],
        raw: [],
        affected: 1,
    },
};

describe('AuthController', (): void => {
    let controller: AuthController;

    beforeEach(async (): Promise<void> => {
        /**
         * NestJS tự động tạo ra một fake module.
         * Khi thực hiện compile, nó khởi tạo tất cả các phụ thuộc cần thiết cho module thử nghiệm.
         * Đảm bảo một môi trường thử nghiệm độc lập với môi trường thực tế,
         * nơi các kiểm thử có thể được tiến hành riêng biệt.
         */
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            /**
             * Thay vì dùng AuthService thật, ta sử dụng mock service.
             * Có thể lựa chọn giữa mockResolvedValue và mockImplementation để giả lập kết quả trả về.
             * - MockResolvedValue giả lập kết quả trả về.
             * - MockImplementation giúp giả lập 1 hàm với đầy đủ các logic trong hàm đó.
             */
            providers: [
                {
                    /**
                     * Tên của mock service phải trùng với tên của service thật.
                     */
                    provide: AuthService,
                    /**
                     * Thêm các method mock với tên giống với method của service thật.
                     */
                    useValue: {
                        register: jest.fn().mockResolvedValue(mockResponseData.register),
                        login: jest.fn().mockResolvedValue(mockResponseData.loginAndRefreshToken),
                        refreshToken: jest.fn().mockResolvedValue(mockResponseData.loginAndRefreshToken),
                        enableAppMFA: jest.fn().mockResolvedValue(mockResponseData.enableAppMFA),
                        validateAppMFAToken: jest.fn().mockResolvedValue(mockResponseData.validateAppMFA),
                        disableAppMFA: jest.fn().mockResolvedValue(mockResponseData.disableAppMFA),
                        googleLogin: jest.fn().mockResolvedValue(mockResponseData.loginAndRefreshToken),
                    },
                }
            ],
        }).compile();

        /**
         * Lấy 1 instance của controller dependency bằng method module.get().
         * module.get() đóng vai trò là đường dẫn trực tiếp đến các dependency mong muốn,
         * Lưu ý rằng nếu không phải @Controller({ path: 'songs', scope: Scope.DEFAULT }) mà là Scope.TRANSIENT hay REQUEST thì không dùng dc module.get().
         */
        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    it('should be return user information except password', async (): Promise<void> => {
        const userInfo: User = await controller.register({
            firstName: 'Khanh',
            lastName: 'Nguyen',
            email: '112@gmail.com',
            password: '123456',
            picture: 'picture',
        });

        expect(userInfo).toEqual(mockResponseData.register);
    });

    it('should be return access token and refresh token', async (): Promise<void> => {
        const loginInfo: LoginAppMFA | LoginJwt = await controller.login({
            email: '1@gmail.com',
            password: '123456',
        });

        expect(loginInfo).toEqual(mockResponseData.loginAndRefreshToken);
    });

    it('should be not throw exception when go to google login', async (): Promise<void> => {
        await expect(controller.goToGoogleLogin()).resolves.not.toThrow();
    });

    it('should be return access token and refresh token by google login', async (): Promise<void> => {
        const req = { user: { id: 1 } } as Express.AuthenticatedRequest;
        const secret = await controller.googleLogin(req);

        expect(secret).toEqual(mockResponseData.loginAndRefreshToken);
    });

    it('should be return access token and refresh token', async (): Promise<void> => {
        const refreshToken: LoginJwt = await controller.refreshToken({
            refreshToken: 'this is mock refresh token',
        });

        expect(refreshToken).toEqual(mockResponseData.loginAndRefreshToken);
    });

    it('should return appMFA secret on enableAppMFA', async (): Promise<void> => {
        const req = { user: { id: 1 } } as Express.AuthenticatedRequest;
        const secret: { secret: string } = await controller.enableAppMFA(req);

        expect(secret).toEqual(mockResponseData.enableAppMFA);
    });

    it('should return verified status on validateAppMFA', async (): Promise<void> => {
        const req = { user: { id: 1 } } as Express.AuthenticatedRequest;
        const validateTokenDTO = { token: '123456' };
        const verified: { verified: boolean } = await controller.validateAppMFAToken(req, validateTokenDTO);

        expect(verified).toEqual(mockResponseData.validateAppMFA);
    });

    it('should return update result on disableAppMFA', async (): Promise<void> => {
        const req = { user: { id: 1 } } as Express.AuthenticatedRequest;
        const result: UpdateResult = await controller.disableAppMFA(req);

        expect(result).toEqual(mockResponseData.disableAppMFA);
    });
});
