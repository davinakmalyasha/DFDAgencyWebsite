import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Middleware to validate Express requests using our internal @dfd/shared logic
export const validateRequest = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the request body
            schema.parse(req.body);
            next();
        } catch (error: unknown) {
            if (error instanceof z.ZodError) {
                const combinedMessage = error.issues.map(i => i.message).join(', ');
                return res.status(400).json({
                    success: false,
                    message: combinedMessage,
                    data: null,
                    error: error.issues
                });
            }
            next(error);
        }
    };
};
