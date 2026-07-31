import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, userContext } = await req.json();

    // Construct a dynamic system prompt based on the user's context
    let systemPrompt = `You are the friendly, professional, and knowledgeable AI Support Assistant for CleanRide, a premium vehicle doorstep detailing platform.
    Your goal is to help users with their questions, bookings, and navigation. 
    Keep responses concise, helpful, and polite. Always format your text with markdown if needed (e.g. bolding key terms like **The Signature Detail**).
    
    CRITICAL KNOWLEDGE BASE:
    - CleanRide brings ultimate luxury car care directly to the customer's location.
    - We offer 4 main packages:
      1. Quick Wash ($49): Exterior wash, interior vacuum, tire dressing (45 mins).
      2. Standard Detail ($99): Quick Wash + hand wax, leather conditioning, window cleaning (1.5 hrs).
      3. Premium Care ($149): Standard Detail + clay bar treatment, carpet shampooing, engine bay wipe down (2.5 hrs).
      4. The Signature Detail ($249): Premium Care + ceramic coating, paint correction, interior ozone treatment (4 hrs).
    - VIP Memberships:
      - CleanRide VIP ($29/month): 20% off all bookings, priority scheduling, free monthly wax.
    - Loyalty Rewards (CleanCoins):
      - Earn 10 points per $1 spent.
      - Tiers: Bronze (0-499 pts, Default), Silver (500-1499 pts, 5% off washes), Gold (1500-4999 pts, 10% off + free wax), Platinum (5000+ pts, 15% off + priority).
    
    If the user asks a question, use your knowledge base or tools to provide an accurate answer. Do not hallucinate prices or services.`;

    if (userContext) {
      systemPrompt += `\n\nYou are currently talking to: ${userContext.name || 'a user'}.`;
      if (userContext.role) {
        systemPrompt += `\nTheir account type is: ${userContext.role}.`;
      }
    }

    // convertToCoreMessages is standard, but we'll manually map to be safe
    // since the client sends UIMessage with 'parts' instead of 'content'
    const coreMessages = messages.map((m: any) => {
      let content = m.content || '';
      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
      }
      return {
        role: m.role,
        content: content
      };
    });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: coreMessages,
      onError: ({ error }) => {
        console.error('streamText error:', error);
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to connect to AI server' }, { status: 500 });
  }
}
