import { PrismaClient } from '@prisma/client';

// Create a base Prisma client
const basePrisma = new PrismaClient();

// Define generic types for query extensions to avoid implicit any
type QueryArgs = { where?: any;[key: string]: any };
type QueryFn = (args: QueryArgs) => Promise<any>;

const softDeleteConfig = {
    async findMany({ args, query }: { args: QueryArgs, query: QueryFn }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
    },
    async findFirst({ args, query }: { args: QueryArgs, query: QueryFn }) {
        args.where = { deletedAt: null, ...args.where };
        return query(args);
    }
};

// Add a Prisma Client Extension for Soft Deletes 
export const prisma = basePrisma.$extends({
    query: {
        package: softDeleteConfig,
        project: softDeleteConfig,
        lead: softDeleteConfig,
        order: softDeleteConfig,
        article: softDeleteConfig,
        projectImage: softDeleteConfig
    }
});
