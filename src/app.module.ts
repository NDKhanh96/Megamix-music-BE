import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from 'src/utils/environment';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
            validate
        })
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
