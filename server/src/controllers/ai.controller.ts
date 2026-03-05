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
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `You are an expert marketing copywriter for DFD Agency, an AI-powered web agency in Indonesia. 
            Generate a creative SEO title, a high-converting meta description, and short marketing content for a ${type} with this context: ${context}.
            Respond ONLY in JSON format with exactly three keys: "title", "description", and "content". All text must be in Indonesian.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse Gemini JSON:', text);
                return res.status(500).json({ success: false, message: 'AI returned invalid format' });
            }

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

