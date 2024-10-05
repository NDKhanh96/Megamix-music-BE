export type LoginAppMFA = {
    validateAppMFA: string;
    message: string
};

export type LoginJwt = {
    accessToken: string;
    refreshToken: string;
};

export type JwtPayload = {
    email: string;
    sub: number;
};
