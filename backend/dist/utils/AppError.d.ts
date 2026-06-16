export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string, code?: string, isOperational?: boolean);
}
//# sourceMappingURL=AppError.d.ts.map