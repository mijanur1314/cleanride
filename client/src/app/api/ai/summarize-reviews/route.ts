import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function GET() {
  try {
    // 1. Fetch all reviews from the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const response = await fetch(`${backendUrl}/reviews`);
    if (!response.ok) {
      throw new Error('Failed to fetch reviews from backend');
    }
    
    const data = await response.json();
    const reviews = data.data?.reviews || [];

    if (reviews.length === 0) {
      return NextResponse.json({ 
        pros: ['No reviews yet'], 
        cons: ['No reviews yet'], 
        verdict: 'Not enough data to form a verdict yet.' 
      });
    }

    // 2. Format reviews into a text block
    const reviewsText = reviews.map((r: any) => `Rating: ${r.rating}/5. Comment: ${r.comment}`).join('\n');

    // 3. Ask Gemini to summarize
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: `You are an expert customer feedback analyst for CleanRide. Analyze these user reviews and provide a concise summary.
          
Reviews:
${reviewsText}`,
        },
      ],
      schema: z.object({
        pros: z.array(z.string()).describe('List of 2-3 main positive points from the reviews'),
        cons: z.array(z.string()).describe('List of 2-3 main negative points or areas for improvement'),
        verdict: z.string().describe('A single 1-2 sentence overall verdict summarizing the general sentiment')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error('AI Review Summarization Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to summarize reviews' }, { status: 500 });
  }
}
