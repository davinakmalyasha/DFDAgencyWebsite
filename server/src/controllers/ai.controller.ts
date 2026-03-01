import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Logic (Gemini API Integration)
 * Part of "Absolute Perfection": Automated SEO & Copywriting
 */
export class AIController {
    static async generateCopy(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, context } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return res.status(503).json({
                    success: false,
                    message: 'AI Service currently unavailable (Missing API Key)',
                    data: null
                });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `You are an expert marketing copywriter for DFD Agency, an AI-powered web agency in Indonesia. 
            Generate a creative SEO title, a high-converting meta description, and short marketing content for a ${type} with this context: ${context}.
            Respond ONLY in JSON format with keys: title, description, content.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (handling potential markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

            res.status(200).json({
                success: true,
                message: 'AI Copy generated successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }
}

