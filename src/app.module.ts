import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigServiceModule, DatabaseConfigModule, JwtConfigModule } from 'src/utils/configs';

@Module({
    imports: [
        /**
         * ConfigServiceModule phải ở trên cùng để load .env file trước
         */
        ConfigServiceModule,
        DatabaseConfigModule,
        JwtConfigModule,
        AuthModule,
        UsersModule,
    ],
    controllers: [],
    providers: [
        /**
         * provide: APP_INTERCEPTOR cấu hình để sử dụng các decorator như @Exclude và @Expose trong entities.
         */
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        }
    ],
})
export class AppModule {}
