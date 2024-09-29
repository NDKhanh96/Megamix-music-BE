import { Module } from '@nestjs/common';
import { ConfigServiceModule, DatabaseConfigModule } from 'src/utils/configs';

@Module({
    imports: [
        ConfigServiceModule,
        DatabaseConfigModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
