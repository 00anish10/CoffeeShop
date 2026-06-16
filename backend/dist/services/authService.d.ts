import { Role } from '@prisma/client';
export interface TokenPayload {
    sub: string;
    email: string;
    role: Role;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function signTokens(userId: string, email: string, role: Role): Promise<TokenPair>;
export declare function verifyToken(token: string): TokenPayload | null;
export declare function verifyRefreshToken(token: string): {
    jti: string;
    sub: string;
} | null;
export declare function rotateRefreshToken(userId: string): Promise<string>;
export declare function revokeRefreshToken(userId: string): Promise<void>;
//# sourceMappingURL=authService.d.ts.map