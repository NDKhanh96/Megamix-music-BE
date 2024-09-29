/**
 * This import must be the first import in the file.
 */
import './utils/safeExecutionExtensions';

import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import type { EnvFileVariables } from 'src/utils/environment';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app: INestApplication<ExpressAdapter> = await NestFactory.create(AppModule);
    const configService: ConfigService<EnvFileVariables> = app.get(ConfigService);
    const port: number = configService.get('APP_PORT');

    await app.listen(port);
}
bootstrap();
