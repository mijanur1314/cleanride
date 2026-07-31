import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Download the image and convert to base64
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    let mimeType = 'image/jpeg';
    if (imageUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    else if (imageUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'You are an elite car wash assessment AI for CleanRide. Analyze this car image. Tell me how dirty it is, and recommend a package (either "Basic Clean", "Deep Clean", "Premium Detail", or "The Signature Detail"). Also give a short reason.' },
            {
              type: 'image',
              image: arrayBuffer,
            },
          ],
        },
      ],
      schema: z.object({
        dirtLevel: z.enum(['Low', 'Medium', 'High', 'Extreme']).describe('How dirty the car appears'),
        recommendedPackage: z.enum(['Basic Clean', 'Deep Clean', 'Premium Detail', 'The Signature Detail']).describe('The recommended wash package'),
        reason: z.string().describe('A short, 1-2 sentence explanation of why this package is recommended based on the visible dirt or car condition.')
      }),
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error('AI Assessment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}
