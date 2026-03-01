"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Create a base Prisma client
const basePrisma = new client_1.PrismaClient();
// Add a Prisma Client Extension for Soft Deletes 
// This ensures that any `findMany` or `findFirst` query automatically filters out records where `deletedAt` is not null for specific models.
exports.prisma = basePrisma.$extends({
    query: {
        package: {
            findMany(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findFirst(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findUnique(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    // FindUnique does not support adding deletedAt: null easily because where requires unique fields.
                    // We often convert findUnique to findFirst in soft-delete architectures, but for simplicity here,
                    // we'll leave it or rely on the service layer.
                    return query(args);
                });
            }
        },
        project: {
            findMany(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findFirst(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            }
        },
        lead: {
            findMany(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findFirst(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            }
        },
        order: {
            findMany(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findFirst(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            }
        },
        article: {
            findMany(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            },
            findFirst(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    args.where = Object.assign({ deletedAt: null }, args.where);
                    return query(args);
                });
            }
        }
    }
});
