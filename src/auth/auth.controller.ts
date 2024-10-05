import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { LoginDto, RefreshTokenDto, ValidateTokenDTO } from 'src/auth/dto';
import type { LoginAppMFA, LoginJwt } from 'src/types';
import { CreateUserDto } from 'src/users/dto';
import { User } from 'src/users/entities';
import type { UpdateResult } from 'typeorm';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    @ApiBody({ type: CreateUserDto })
    @ApiOperation({ summary: 'User register' })
    @ApiResponse({ status: 201, description: 'Signup successful' })
    @ApiResponse({ status: 401, description: 'Signup failed' })
    async register(@Body() userDTO: CreateUserDto): Promise<User> {
        /**
         * Cần phải khởi tạo 1 instance mới từ class User để kích hoạt được @Exclude và @Expose trong entities.
         */
        return new User(await this.authService.register(userDTO));
    }

    @Post('login')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDTO: LoginDto): Promise<LoginAppMFA | LoginJwt> {
        return this.authService.login(loginDTO);
    }

    @Get('google/login')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Go to google login. By some reason, this api can not use in swagger' })
    async goToGoogleLogin(): Promise<void> {}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @HttpCode(200)
    @ApiOperation({ summary: 'Login by google account. By some reason, this api can not use in swagger' })
    async googleLogin(@Req() req: Express.AuthenticatedRequest): Promise<LoginAppMFA | LoginJwt>{
        return await this.authService.googleLogin(req);
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiBody({ type: RefreshTokenDto })
    @ApiOperation({ summary: 'Generate new token by refresh token' })
    @ApiResponse({ status: 200, description: 'Refresh token successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginJwt> {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Get('appMFA/enable')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate token to use in authenticator app' })
    @ApiResponse({ status: 200, description: 'Enable 2 factor authentication successful' })
    enableAppMFA(@Req() req: Express.AuthenticatedRequest): Promise<{secret: string}> {
        return this.authService.enableAppMFA(req.user.id);
    }

    @Post('appMFA/validate')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiBearerAuth()
    @ApiBody({ type: ValidateTokenDTO })
    @ApiOperation({ summary: 'Validate appMFA by code in authenticator app' })
    @ApiResponse({ status: 200, description: 'Validate 2 factor authentication successful' })
    validateAppMFAToken(@Req() req: Express.AuthenticatedRequest, @Body() validateTokenDTO: { token: string }): Promise<{ verified: boolean }> {
        return this.authService.validateAppMFAToken(req.user.id, validateTokenDTO.token);
    }

    @Get('appMFA/disable')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Disable appMFA method' })
    @ApiResponse({ status: 200, description: 'Disable 2 factor authentication successful' })
    disableAppMFA(@Req() req: Express.AuthenticatedRequest): Promise<UpdateResult> {
        return this.authService.disableAppMFA(req.user.id);
    }
}
