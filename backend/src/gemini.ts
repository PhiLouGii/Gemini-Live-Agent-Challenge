import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION!,
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
});

export async function askGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.candidates![0].content.parts[0].text!;
}

export async function analyzeScreenshot(
  base64Image: string,
  userRequest: string
): Promise<string> {
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image,
          }
        },
        {
          text: `You are Grandma Mode, a warm and helpful AI assistant.
          
The user says: "${userRequest}"

Look at this screenshot and describe:
1. What page is this?
2. What are the main interactive elements (buttons, forms, links)?
3. What should I do to help the user with their request?

Be warm, clear and simple in your response.`
        }
      ]
    }]
  });

  return result.response.candidates![0].content.parts[0].text!;
}