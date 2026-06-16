export interface PaginationResult {
    skip: number;
    take: number;
    page: number;
    limit: number;
}
export declare function parsePage(query: {
    page?: string;
    limit?: string;
}): PaginationResult;
//# sourceMappingURL=pagination.d.ts.map