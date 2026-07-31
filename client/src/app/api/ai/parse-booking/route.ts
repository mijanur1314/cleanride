import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: `You are an AI booking assistant for CleanRide, a premium car wash service. 
Your job is to extract structured booking information from a user's voice transcript.
If a piece of information is missing, leave it as null or empty string, do NOT guess.
Services available: "Express Wash", "The Signature Detail", "Showroom Reset". Map whatever they say to the closest match.
Vehicle types: "Hatchbacks", "Sedans", "SUVs", "Motorcycles", "Electric Vehicles (EVs)". Map to closest.
Always return dates in a format parseable by Javascript (e.g. ISO string or "YYYY-MM-DDTHH:mm"). Assume the year is the current year if not specified.`,
      messages: [
        {
          role: 'user',
          content: transcript
        },
      ],
      schema: z.object({
        serviceName: z.string().describe("The requested service package, or empty string if not mentioned"),
        vehicleType: z.string().describe("The type of vehicle (e.g. Sedan, SUV), or empty string if not mentioned"),
        date: z.string().describe("The requested date and time in ISO format or valid JS parseable string, or empty string if not mentioned"),
        address: z.string().describe("The address for the service, or empty string if not mentioned")
      }),
    });

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error('AI Parse Booking Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse booking transcript' }, { status: 500 });
  }
}
