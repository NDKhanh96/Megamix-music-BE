/**
 * This import must be the first import in the file.
 */
import 'src/utils/safeExecutionExtensions';

import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import type { LoginDto } from 'src/auth/dto';
import { RefreshToken } from 'src/auth/entities';
import type { CreateUserDto } from 'src/users/dto';
import * as request from 'supertest';
import type { Repository } from 'typeorm';

/**
 * - Google OAuth 2.0 không thể test được vì cần phải vào trình duyệt để xác thực.
 * - validateAppMFAToken() không thể test được vì cần lấy OTP từ ứng dụng google authenticator.
 */
describe('Auth', (): void => {
    let app: INestApplication;

    let refreshToken: string;
    let accessToken: string;

    /**
     * Khởi tại database trước khi chạy tất cả các test case.
     */
    beforeAll(async (): Promise<void> => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule
            ]
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    /**
     * - Xóa tất cả dữ liệu trong database sau khi chạy xong mỗi test case.
     * - Tham số trong getRepositoryToken() là class của entity cần xóa.
     */
    afterAll(async(): Promise<void> => {
        const refreshTokenRepository: Repository<RefreshToken> = app.get(getRepositoryToken(RefreshToken));

        await refreshTokenRepository.delete({});
    });

    it('/ (POST) register', async(): Promise<void> => {
        const userDto: CreateUserDto = {
            firstName: 'John',
            lastName: 'Doe',
            picture: '',
            email: 'john@gmail.com',
            password: '123456'
        };

        const response: request.Response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(userDto);

        expect(response.status).toBe(201);
        expect(response.body.firstName).toEqual(userDto.firstName);
        expect(response.body.lastName).toEqual(userDto.lastName);
        expect(response.body.picture).toEqual(userDto.picture);
        expect(response.body.email).toEqual(userDto.email);
        expect(response.body.appMFASecret).toBe('');
        expect(response.body.enableAppMFA).toBe(false);
        expect(response.body.isCredential).toBe(true);
    });

    it('/ (POST) login', async(): Promise<void> => {
        const loginDto: LoginDto = {
            email: 'john@gmail.com',
            password: '123456'
        };

        const response: request.Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto);

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();

        refreshToken = response.body.refreshToken;
        accessToken = response.body.accessToken;
    });

    it('/ (POST) refresh', async(): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken: refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
    });

    /**
     * - Phải vào node_modules/speakeasy/index.js sửa this.generateSecretASCII thành exports.generateSecretASCII.
     * - Vì thư viện speakeasy đã outdate 7 năm nên cần sửa nếu không muốn lỗi can't read property generateSecretASCII of undefined.
     * - Có vẻ lỗi này chỉ xảy ra trong quá trình test, vì khi chạy file dist thì đã biên dịch thành js nên không bị lỗi.
     */
    it('/ (GET) enableAppMFA', async(): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
            .get('/auth/appMFA/enable')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.secret).toBeDefined();
    });

    it('/ (GET) disableAppMFA', async(): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
            .get('/auth/appMFA/disable')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        expect(response.status).toBe(200);
    });
});
