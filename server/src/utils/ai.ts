import { env } from './env';

// We have to use dynamic import because @google/genai is an ESM-only module
let aiClient: any = null;
let aiType: any = null;

const initAI = async () => {
  if (!env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    const genai = await import('@google/genai');
    aiClient = new genai.GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    aiType = genai.Type;
  }
  return aiClient;
};

export const verifyKYCDocument = async (imageUrl: string) => {
  const ai = await initAI();
  if (!ai) {
    console.warn('GEMINI_API_KEY not configured. Skipping AI KYC verification.');
    return { isValid: false, confidence: 0, extractedName: null, reason: 'AI disabled' };
  }

  try {
    // 1. Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine mime type from URL or default to jpeg
    let mimeType = 'image/jpeg';
    if (imageUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    else if (imageUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

    // 2. Define the expected JSON response schema
    const responseSchema = {
      type: aiType.OBJECT,
      properties: {
        isValid: {
          type: aiType.BOOLEAN,
          description: "True if the document is a valid, real identity document (e.g., Driver's License, Passport, National ID). False if it's a random image, blank, or clearly manipulated."
        },
        confidence: {
          type: aiType.NUMBER,
          description: "Confidence score between 0.0 and 1.0"
        },
        extractedName: {
          type: aiType.STRING,
          description: "The full name of the person extracted from the ID, or null if not found",
          nullable: true
        },
        reason: {
          type: aiType.STRING,
          description: "A short sentence explaining the decision"
        }
      },
      required: ["isValid", "confidence", "extractedName", "reason"]
    };

    // 3. Call Gemini
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "You are an automated KYC (Know Your Customer) compliance officer. Analyze this image and verify if it is a valid government-issued identity document." },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for deterministic evaluation
      }
    });

    const text = result.text;
    if (!text) throw new Error('Empty response from Gemini');
    
    return JSON.parse(text) as { isValid: boolean, confidence: number, extractedName: string | null, reason: string };
  } catch (error) {
    console.error('AI KYC Verification Error:', error);
    return { isValid: false, confidence: 0, extractedName: null, reason: 'Verification process failed' };
  }
};
