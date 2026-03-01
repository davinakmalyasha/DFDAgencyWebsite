import { prisma } from '../lib/prisma';
import { ProjectInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';

export class ProjectService {
    /**
     * Get all projects
     */
    static async getAllProjects(page: number = 1, limit: number = 10, isFeatured?: boolean) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
        const where: any = {};
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured;
        }

        const [data, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                include: { Images: true }
            }),
            prisma.project.count({ where })
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get single project by ID or Slug
     */
    static async getProject(identifier: number | string) {
        const where = typeof identifier === 'number'
            ? { id: identifier }
            : { slug: identifier };

        return prisma.project.findFirst({
            where,
            include: { Images: true }
        });
    }

    /**
     * Create new project
     */
    static async createProject(data: ProjectInput) {
        return prisma.project.create({
            data: {
                ...data,
                techStack: data.techStack as any,
                domainExpiryDate: data.domainExpiryDate ? new Date(data.domainExpiryDate) : null
            }
        });
    }

    /**
     * Update project
     */
    static async updateProject(id: number, data: Partial<ProjectInput>) {
        return prisma.project.update({
            where: { id },
            data: {
                ...data,
                techStack: data.techStack ? (data.techStack as any) : undefined,
                domainExpiryDate: data.domainExpiryDate !== undefined
                    ? (data.domainExpiryDate ? new Date(data.domainExpiryDate) : null)
                    : undefined
            }
        });
    }

    /**
     * Soft delete project with slug protection and cascade to images
     */
    static async deleteProject(id: number) {
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) throw new Error('Project not found');

        const deletedSlug = `${project.slug}-deleted-${Date.now()}`;

        return prisma.$transaction(async (tx: any) => {
            // 1. Soft delete the project and rename slug
            const updatedProject = await tx.project.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    slug: deletedSlug
                }
            });

            // 2. Cascade soft delete to images
            await tx.projectImage.updateMany({
                where: { projectId: id },
                data: { deletedAt: new Date() }
            });

            return updatedProject;
        });
    }

    /**
     * Add project image
     */
    static async addImage(projectId: number, data: { imageUrl: string; caption?: string; sortOrder?: number }) {
        return prisma.projectImage.create({
            data: {
                projectId,
                ...data
            }
        });
    }

    /**
     * Delete project image (Hard or Soft?) 
     * Blueprint says "Delete project image" in API contract. 
     * We'll use soft delete for consistency.
     */
    static async deleteImage(imageId: number) {
        return prisma.projectImage.update({
            where: { id: imageId },
            data: { deletedAt: new Date() }
        });
    }

    /**
     * Increment view count
     */
    static async incrementViews(id: number) {
        return prisma.project.update({
            where: { id },
            data: { viewsCount: { increment: 1 } }
        });
    }
}
