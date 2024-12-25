import { plainToInstance, Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, validateSync, type ValidationError } from 'class-validator';

/**
 * Việc validate ở đây có 2 tác dụng:
 * - Báo lỗi nếu thiếu biến hoặc biến sai kiểu dữ liệu trong .env file.
 * - Chuyển đổi giá trị từ string sang các kiểu dữ liệu khác, lưu ý việc chuyển đổi chỉ có tác dụng khi get biến môi trường từ ConfigService.
 */
export class EnvFileVariables {
    @IsNotEmpty()
    @Transform(({ value }: TransformFnParams ): number => parseInt(value, 10))
    @IsNumber()
        APP_PORT: number;

    @IsNotEmpty()
    @Transform(({ value }: TransformFnParams ): boolean => JSON.parse(value))
    @IsBoolean()
        DB_SYNCHRONIZE: boolean;

    @IsNotEmpty()
    @IsString()
        DB_HOST: string;

    @IsNotEmpty()
    @Transform(({ value }: TransformFnParams ): number => parseInt(value, 10))
    @IsNumber()
        DB_PORT: number;

    @IsNotEmpty()
    @IsString()
        DB_NAME: string;

    @IsNotEmpty()
    @IsString()
        DB_USERNAME: string;

    @IsString()
        DB_PASSWORD: string;

    @IsNotEmpty()
    @Transform(({ value }: TransformFnParams ): boolean => JSON.parse(value))
    @IsBoolean()
        DB_AUTO_DROP_SCHEMA: boolean;

    @IsNotEmpty()
    @IsString()
        JWT_SECRET: string;

    @IsNotEmpty()
    @IsString()
        JWT_EXPIRES_IN: string;

    @IsNotEmpty()
    @IsString()
        REFRESH_TOKEN_EXPIRES_IN: string;

    @IsNotEmpty()
    @IsString()
        BASE_URL: string;

    @IsNotEmpty()
    @IsString()
        GOOGLE_CLIENT_ID: string;

    @IsNotEmpty()
    @IsString()
        GOOGLE_CLIENT_SECRET: string;

    @IsNotEmpty()
    @IsString()
        MAIL_USER: string;

    @IsNotEmpty()
    @IsString()
        MAIL_PASSWORD: string;
}

export function validate (config: Record<string, unknown>): EnvFileVariables {
    const validatedConfig: EnvFileVariables = plainToInstance(EnvFileVariables, config, {
        /**
         * Nếu để true thì khi get thẳng biến môi trường từ ConfigService sẽ tự động chuyển đổi giá trị từ string sang các kiểu dữ liệu khác.
         * Tuy nhiên, với trường hợp đổi sang boolean thì mọi giá trị đều thành true kể cả 'false'.
         */
        enableImplicitConversion: false,
    });
    const errors: ValidationError[] = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validatedConfig;
}
