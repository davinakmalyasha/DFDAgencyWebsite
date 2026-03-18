import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export class OrderNoteController {
    /**
     * Get all notes for a specific order
     */
    static async getNotes(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const notes = await prisma.orderNote.findMany({
                where: { 
                    orderId,
                    isDeleted: false // Exclude soft-deleted notes
                },
                include: {
                    Author: {
                        select: { id: true, username: true, role: true }
                    },
                    Parent: {
                        select: { id: true, content: true, isClient: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({
                success: true,
                message: 'Order notes retrieved successfully',
                data: notes
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new note for an order
     */
    static async createNote(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const { content, isPublic, parentId } = req.body;
            const authorId = req.user!.userId; // from auth middleware
    
            const note = await prisma.orderNote.create({
                data: {
                    orderId,
                    content,
                    isPublic: isPublic ?? false,
                    authorId,
                    parentId: parentId ? parseInt(parentId as string) : null
                },
                include: {
                    Author: {
                        select: { id: true, username: true, role: true }
                    },
                    Parent: {
                        select: { id: true, content: true }
                    }
                }
            });

            // PHASE 11: Notify client of public update (Staff Update)
            if (isPublic) {
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: { Lead: { select: { name: true, whatsapp: true } } }
                });

                if (order && order.Lead.whatsapp) {
                    const { NotificationService } = require('../services/notification.service');
                    NotificationService.notifyStaffUpdate(
                        orderId,
                        order.Lead.name,
                        order.Lead.whatsapp,
                        content
                    ).catch(console.error);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Note created successfully',
                data: note
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing note
     */
    static async updateNote(req: Request, res: Response, next: NextFunction) {
        try {
            const { noteId } = req.params;
            const { content, isPublic } = req.body;
    
            const note = await prisma.orderNote.update({
                where: { id: parseInt(noteId as string) },
                data: {
                    content,
                    isPublic,
                    isEdited: true // Mark as edited
                },
                include: {
                    Author: {
                        select: { id: true, username: true, role: true }
                    },
                    Parent: {
                        select: { id: true, content: true }
                    }
                }
            });

            res.status(200).json({
                success: true,
                message: 'Note updated successfully',
                data: note
            });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Note not found' });
            }
            next(error);
        }
    }

    /**
     * Delete a note
     */
    static async deleteNote(req: Request, res: Response, next: NextFunction) {
        try {
            const { noteId } = req.params;
    
            await prisma.orderNote.update({
                where: { id: parseInt(noteId as string) },
                data: { isDeleted: true } // Soft delete
            });

            res.status(200).json({
                success: true,
                message: 'Note deleted successfully',
                data: null
            });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Note not found' });
            }
            next(error);
        }
    }
}
