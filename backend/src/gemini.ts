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

// Quick test
async function test() {
  const response = await askGemini('Say hello in a warm grandmotherly tone in one sentence.');
  console.log('Gemini says:', response);
}

test();