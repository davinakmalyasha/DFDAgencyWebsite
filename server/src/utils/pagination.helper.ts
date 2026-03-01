export interface PaginationResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export class PaginationHelper {
    static getSkipLimit(page: any, limit: any) {
        const p = Math.max(1, parseInt(page as string) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
        const skip = (p - 1) * l;
        return { skip, limit: l, page: p };
    }

    static formatResult<T>(data: T[], total: number, page: number, limit: number): PaginationResult<T> {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }
}
