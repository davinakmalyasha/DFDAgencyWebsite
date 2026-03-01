import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Middleware to validate Express requests using our internal @dfd/shared logic
export const validateRequest = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the request body
            schema.parse(req.body);
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    data: null,
                    error: error.issues
                });
            }
            next(error);
        }
    };
};
