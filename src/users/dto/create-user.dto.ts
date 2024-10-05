import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @Transform(({ value }: TransformFnParams ): unknown => value ?? '')
    @IsString()
        firstName: string;

    @ApiProperty()
    @Transform(({ value }: TransformFnParams ): unknown => value ?? '')
    @IsString()
        lastName: string;

    @ApiProperty()
    @Transform(({ value }: TransformFnParams ): unknown => value ?? '')
    @IsString()
        picture: string;

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
        email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
        password: string;
}
